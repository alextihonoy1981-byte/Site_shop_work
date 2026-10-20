import { createClient } from "@supabase/supabase-js";
import { deliverLead, validateLead, type Lead } from "@/lib/leads";
import { siteConfig } from "@/lib/config";

const windows = new Map<string, { count: number; expires: number }>();
function limited(key: string) {
  const now = Date.now();
  for (const [id, entry] of windows) if (entry.expires < now) windows.delete(id);
  const entry = windows.get(key) || { count: 0, expires: now + 600_000 };
  if (windows.size >= 10_000 && !windows.has(key)) return true;
  windows.set(key, entry); entry.count++;
  return entry.count > 5;
}
const reply = (error: string, status: number) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestHost = request.headers.get("host") || new URL(request.url).host;
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (!["http:", "https:"].includes(parsed.protocol) || (parsed.host !== requestHost && origin !== siteConfig.url)) return reply("Отправьте заявку с нашего сайта.", 403);
    } catch { return reply("Отправьте заявку с нашего сайта.", 403); }
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply("Неверный формат запроса.", 415);
  if (Number(request.headers.get("content-length") || 0) > 12000) return reply("Слишком большой запрос.", 413);
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  if (limited(ip)) return reply("Слишком много попыток. Попробуйте через 10 минут.", 429);
  let input: unknown;
  try { const body = await request.text(); if (new TextEncoder().encode(body).length > 12000) return reply("Слишком большой запрос.", 413); input = JSON.parse(body); } catch { return reply("Проверьте данные формы.", 400); }
  const validated = validateLead(input);
  if ("error" in validated) return reply(validated.error, 400);
  // Приём включается владельцем только после утверждения условий обработки данных.
  if (process.env.LEAD_INTAKE_ENABLED !== "true" || !process.env.OWNER_NAME || !process.env.OWNER_CONTACT) return reply("Приём заявок через форму пока недоступен. Пожалуйста, попробуйте позже.", 503);
  const supabaseUrl = process.env.SUPABASE_URL, supabaseKey = process.env.SUPABASE_SECRET_KEY;
  const token = process.env.TELEGRAM_BOT_TOKEN, chatId = process.env.TELEGRAM_CHAT_ID;
  const save = supabaseUrl && supabaseKey ? async (lead: Lead) => {
    const client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(8000) }) } });
    const { error } = await client.from("leads").insert(lead);
    return !error;
  } : undefined;
  const notify = token && chatId ? async (lead: Lead) => {
    const time = new Intl.DateTimeFormat("ru-BY", { timeZone: "Europe/Minsk", dateStyle: "short", timeStyle: "short" }).format(new Date());
    const text = ["Новая заявка на консалтинг", `Имя: ${lead.name}`, `Контакт: ${lead.contact}`, `Задача: ${lead.message || "Не указана"}`, `Страница: ${lead.page}`, `UTM: ${JSON.stringify(lead.utm)}`, `Время: ${time}`, `Согласие: ${lead.consent_version}`].join("\n");
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4000) }), signal: AbortSignal.timeout(8000) });
    const result = await response.json(); return response.ok && result.ok === true;
  } : undefined;
  const result = await deliverLead(validated.lead, { save, notify });
  if (!result.saved) console.error("lead_database_not_saved");
  if (!result.notified) console.error("lead_notification_not_delivered");
  if (!result.accepted) return reply("Не удалось отправить заявку. Попробуйте ещё раз немного позже.", 503);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
