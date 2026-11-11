import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const recognitionCookie = "recognition_session";
const sessionSeconds = 2 * 60 * 60;

function passwordRecord() {
  const value = process.env.RECOGNITION_PASSWORD_HASH ?? "";
  return /^scrypt1:[a-f0-9]{32}:[a-f0-9]{64}$/.test(value) ? value : null;
}
export function recognitionConfigured() { return passwordRecord() !== null; }
export function passwordMatches(password: unknown) {
  const record = passwordRecord();
  if (!record || typeof password !== "string" || password.length > 256) return false;
  const [, salt, expected] = record.split(":");
  return timingSafeEqual(scryptSync(password, salt, 32), Buffer.from(expected, "hex"));
}
function signature(payload: string) {
  const secret = passwordRecord();
  if (!secret) throw new Error("Recognition access is not configured");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}
export function issueRecognitionSession(now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ expires: Math.floor(now / 1000) + sessionSeconds,
    nonce: randomBytes(16).toString("hex") })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
export function recognitionSessionValid(cookie: string | undefined, now = Date.now()) {
  if (!passwordRecord() || !cookie || cookie.length > 512) return false;
  try {
    const [payload, supplied, extra] = cookie.split(".");
    if (extra || !payload || !supplied || !/^[A-Za-z0-9_-]+$/.test(supplied)) return false;
    const expected = signature(payload);
    if (supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const seconds = Math.floor(now / 1000);
    return Number.isInteger(data.expires) && data.expires > seconds && data.expires <= seconds + sessionSeconds
      && typeof data.nonce === "string" && /^[a-f0-9]{32}$/.test(data.nonce);
  } catch { return false; }
}
export function sameRecognitionOrigin(request: Request) {
  const origin = request.headers.get("origin");
  try {
    if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
    const parsed = new URL(origin);
    // Next may normalize request.url to localhost while the browser uses 127.0.0.1.
    const host = request.headers.get("host") ?? new URL(request.url).host;
    return ["http:", "https:"].includes(parsed.protocol) && parsed.host === host;
  } catch { return false; }
}

const attempts = new Map<string, { count: number; until: number }>();
export function loginLimited(key: string, now = Date.now()) {
  for (const [id, value] of attempts) if (value.until <= now) attempts.delete(id);
  if (attempts.size >= 10_000 && !attempts.has(key)) return true;
  const value = attempts.get(key) ?? { count: 0, until: now + 600_000 };
  value.count++; attempts.set(key, value);
  return value.count > 5;
}

export async function boundedBody(request: Request, limit: number) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(length) || length < 0 || length > limit) throw new Error("body_limit");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("body_missing");
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      total += value.byteLength; if (total > limit) throw new Error("body_limit");
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks, total);
}
