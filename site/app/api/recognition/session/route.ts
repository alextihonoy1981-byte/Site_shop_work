import { cookies } from "next/headers";
import { boundedBody, issueRecognitionSession, loginLimited, passwordMatches, recognitionConfigured,
  recognitionCookie, recognitionSessionValid, sameRecognitionOrigin } from "@/lib/recognition-auth";

const headers = { "Cache-Control": "no-store" };
export async function GET() {
  const cookie = (await cookies()).get(recognitionCookie)?.value;
  return Response.json({ authenticated: recognitionSessionValid(cookie), configured: recognitionConfigured(),
    cloudReady: !!process.env.SHELFDATA_HF_TOKEN }, { headers });
}
export async function POST(request: Request) {
  if (!sameRecognitionOrigin(request)) return Response.json({ error: "Откройте вход на нашем сайте." }, { status: 403, headers });
  if (!recognitionConfigured()) return Response.json({ error: "Вход ещё не настроен." }, { status: 503, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "Неверный формат." }, { status: 415, headers });
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "local";
  if (loginLimited(ip)) return Response.json({ error: "Слишком много попыток. Повторите через 10 минут." }, { status: 429, headers });
  let password: unknown;
  try { password = JSON.parse((await boundedBody(request, 1024)).toString("utf8")).password; }
  catch { return Response.json({ error: "Проверьте введённые данные." }, { status: 400, headers }); }
  if (!passwordMatches(password)) return Response.json({ error: "Неверный пароль." }, { status: 401, headers });
  (await cookies()).set(recognitionCookie, issueRecognitionSession(), { httpOnly: true, sameSite: "strict",
    secure: process.env.NODE_ENV === "production", path: "/api/recognition", maxAge: 7200 });
  return Response.json({ authenticated: true, cloudReady: !!process.env.SHELFDATA_HF_TOKEN }, { headers });
}
export async function DELETE(request: Request) {
  if (!sameRecognitionOrigin(request)) return new Response(null, { status: 403 });
  (await cookies()).set(recognitionCookie, "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production",
    path: "/api/recognition", maxAge: 0 });
  return Response.json({ authenticated: false }, { headers });
}
