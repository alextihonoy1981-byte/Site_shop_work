export const recognitionModel = "PaddlePaddle/PaddleOCR-VL-1.6";
export const recognitionRevision = "132c45f52c0a26ed5a6b2f6bd8e3985794cc27dd";
export type RecognitionResult = { text: string; source_sha256: string; model: string; revision: string;
  gpu_call_seconds: number; sku_confirmed: false; synthetic_only: true };

export function validCloudResult(value: unknown, expectedHash: string): value is RecognitionResult {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return typeof r.text === "string" && r.text.trim().length > 0 && r.text.length <= 16000
    && r.source_sha256 === expectedHash && r.model === recognitionModel && r.revision === recognitionRevision
    && r.sku_confirmed === false && r.synthetic_only === true && typeof r.gpu_call_seconds === "number"
    && Number.isFinite(r.gpu_call_seconds) && r.gpu_call_seconds >= 0 && r.gpu_call_seconds <= 120;
}
export function pngWithinLimits(bytes: Uint8Array) {
  if (bytes.length < 33 || bytes.length > 3 * 1024 * 1024) return false;
  const signature = [137,80,78,71,13,10,26,10];
  if (!signature.every((value, i) => bytes[i] === value)) return false;
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (data.getUint32(8) !== 13 || String.fromCharCode(...bytes.slice(12,16)) !== "IHDR") return false;
  const width = data.getUint32(16), height = data.getUint32(20);
  return width > 0 && height > 0 && width <= 1800 && height <= 1800;
}
export function recognitionCsv(filename: string, text: string) {
  const cell = (value: string) => `"${(/^[\s\u0000-\u001f]*[=+@-]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
  return "\uFEFF" + ["Файл;Распознанный текст", `${cell(filename)};${cell(text)}`].join("\r\n") + "\r\n";
}
