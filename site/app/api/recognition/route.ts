import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { Client, handle_file } from "@gradio/client";
import { boundedBody, recognitionCookie, recognitionSessionValid, sameRecognitionOrigin } from "@/lib/recognition-auth";
import { pngWithinLimits, validCloudResult } from "@/lib/recognition-result";

export const maxDuration = 60;
const headers = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });
let active = 0;
export async function POST(request: Request) {
  if (!sameRecognitionOrigin(request)) return fail("Отправьте фото с нашего сайта.", 403);
  if (!recognitionSessionValid((await cookies()).get(recognitionCookie)?.value)) return fail("Войдите по паролю.", 401);
  const token = process.env.SHELFDATA_HF_TOKEN;
  if (!token?.startsWith("hf_")) return fail("Облачное распознавание ещё не подключено.", 503);
  if (request.headers.get("x-synthetic-consent") !== "1") return fail("Подтвердите отправку тестового изображения в облако.", 422);
  if (request.headers.get("content-type") !== "image/png") return fail("Нужен подготовленный PNG.", 415);
  if (active >= 1) return fail("Другое фото уже обрабатывается. Дождитесь результата.", 429);
  active++;
  let bytes: Buffer;
  try { bytes = await boundedBody(request, 3 * 1024 * 1024); }
  catch { active--; return fail("Фото слишком большое или повреждено.", 413); }
  if (!pngWithinLimits(bytes)) { active--; return fail("Нужен PNG до 1800 пикселей по стороне и 3 МБ.", 422); }
  const digest = createHash("sha256").update(bytes).digest("hex");
  const encoder = new TextEncoder();
  let cancelStream = () => {};
  const stream = new ReadableStream({
    async start(controller) {
      let app: Client | undefined;
      let job: ReturnType<Client["submit"]> | undefined;
      let closed = false;
      let released = false;
      const release = () => { if (!released) { released = true; active--; } };
      const send = (data: unknown) => {
        if (!closed) {
          try { controller.enqueue(encoder.encode(JSON.stringify(data) + "\n")); }
          catch { disconnected(); }
        }
      };
      const stop = () => {
        if (!closed) { closed = true; try { controller.close(); } catch { /* Consumer may have already closed the stream. */ } }
      };
      const cancel = () => {
        try { void Promise.resolve(job?.cancel()).catch(() => {}); } catch { /* No raw auth-bearing errors. */ }
        try { app?.close(); } catch { /* Transport cleanup only. */ }
      };
      let expired = false;
      const timer = setTimeout(() => {
        expired = true;
        send({ type: "error", error: "Время ожидания истекло. Запрос может ещё выполняться в облаке; проверьте результат перед повтором." });
        cancel(); release(); stop();
      }, 50_000);
      const disconnected = () => { expired = true; clearTimeout(timer); cancel(); release(); stop(); };
      cancelStream = disconnected;
      request.signal.addEventListener("abort", disconnected, { once: true });
      try {
        if (request.signal.aborted) { disconnected(); return; }
        send({ type: "status", message: "Подключаемся к облачному распознаванию…" });
        app = await Client.connect("Tihonov1981/deepseec1981", { token: token as `hf_${string}`, events: ["status", "data"] });
        if (expired) return;
        job = app.submit("/cloud_ocr", [handle_file(new File([new Uint8Array(bytes)], "input.png", { type: "image/png" })), digest, true]);
        let received = false;
        for await (const event of job) {
          if (expired) break;
          if (event.type === "status" && !received) {
            if (event.stage === "error") throw new Error("cloud_processing_error");
            send({ type: "status", message: event.stage === "generating" ? "Модель распознаёт текст…" : "Ожидаем свободный GPU…" });
          }
          if (event.type === "data") {
            const result = Array.isArray(event.data) ? event.data[0] : undefined;
            if (!validCloudResult(result, digest)) throw new Error("cloud_output_invalid");
            // Explicitly allowlist fields: never forward remote file paths/URLs or arbitrary metadata.
            send({ type: "result", result: { text: result.text, source_sha256: digest, model: result.model,
              revision: result.revision, gpu_call_seconds: result.gpu_call_seconds, sku_confirmed: false, synthetic_only: true } });
            received = true;
          }
        }
        if (!received && !expired) throw new Error("cloud_no_result");
      } catch {
        if (!expired) send({ type: "error", error: "Облако не вернуло проверенный результат. Возможны очередь, квота или ошибка чтения. Автоматического повтора нет." });
      } finally {
        clearTimeout(timer); request.signal.removeEventListener("abort", disconnected);
        cancel(); release(); stop();
      }
    },
    cancel() { cancelStream(); },
  });
  return new Response(stream, { headers: { ...headers, "Content-Type": "application/x-ndjson; charset=utf-8", "X-Content-Type-Options": "nosniff" } });
}
