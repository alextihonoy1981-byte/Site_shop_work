export type Lead = { name: string; contact: string; message: string; page: string; utm: Record<string, string>; consent: true; consent_version: string };
export function validateLead(input: unknown): { lead: Lead } | { error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Проверьте данные формы." };
  const data = input as Record<string, unknown>;
  const text = (key: string) => typeof data[key] === "string" ? (data[key] as string).trim() : "";
  if (text("company")) return { error: "Не удалось отправить заявку." };
  const name = text("name"), contact = text("contact"), message = text("message"), page = text("page");
  if (!name || name.length > 100 || /[\x00-\x1f]/.test(name)) return { error: "Укажите имя длиной до 100 символов." };
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phone = /^\+?[\d\s()\-]+$/;
  const digits = contact.replace(/\D/g, "");
  if (contact.length > 160 || !(email.test(contact) || (phone.test(contact) && digits.length >= 7 && digits.length <= 15))) return { error: "Укажите корректный телефон или email для связи." };
  if (data.consent !== true) return { error: "Подтвердите согласие на обработку данных." };
  if (message.length > 3000 || page.length > 2000) return { error: "Сократите описание задачи до 3000 символов." };
  if (page) { try { if (!["http:", "https:"].includes(new URL(page).protocol)) return { error: "Некорректный адрес страницы." }; } catch { return { error: "Некорректный адрес страницы." }; } }
  const source = data.utm && typeof data.utm === "object" ? data.utm as Record<string, unknown> : {};
  const utm = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].flatMap(key => typeof source[key] === "string" ? [[key, source[key].slice(0, 200)]] : []));
  return { lead: { name, contact, message, page, utm, consent: true, consent_version: "2026-10-20" } };
}
export async function deliverLead(lead: Lead, channels: { save?: (lead: Lead) => Promise<boolean>; notify?: (lead: Lead) => Promise<boolean> }) {
  const run = async (send?: (lead: Lead) => Promise<boolean>) => { try { return send ? await send(lead) : false; } catch { return false; } };
  const [saved, notified] = await Promise.all([run(channels.save), run(channels.notify)]);
  return { saved, notified, accepted: saved || notified };
}
