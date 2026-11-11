"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { recognitionCsv, type RecognitionResult } from "@/lib/recognition-result";

async function prepareImage(file: File) {
  if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 25 * 1024 * 1024 || !file.size)
    throw new Error("Выберите JPEG или PNG до 25 МБ.");
  const image = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    if (image.width * image.height > 64_000_000) throw new Error("Слишком большое разрешение. Выберите фото до 64 Мп.");
    let side = 1800;
    for (let attempt = 0; attempt < 5; attempt++, side = Math.floor(side * 0.8)) {
      const ratio = Math.min(1, side / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(image.width * ratio)); canvas.height = Math.max(1, Math.floor(image.height * ratio));
      const context = canvas.getContext("2d"); if (!context) throw new Error("Браузер не смог подготовить фото.");
      context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Не удалось прочитать фото.")), "image/png"));
      if (blob.size <= 3 * 1024 * 1024) return blob;
    }
    throw new Error("Фото не удалось уменьшить до 3 МБ. Выберите отдельный ценник крупным планом.");
  } finally { image.close(); }
}

export function RecognitionWorkspace() {
  const [session, setSession] = useState<{ authenticated: boolean; configured: boolean; cloudReady: boolean } | null>(null);
  const [password, setPassword] = useState(""); const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    const request = new AbortController();
    fetch("/api/recognition/session", { cache: "no-store", signal: request.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(setSession)
      .catch(() => { if (!request.signal.aborted) setError("Не удалось проверить вход. Обновите страницу."); });
    return () => { request.abort(); controller.current?.abort(); };
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/recognition/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      setPassword(""); const value = await response.json();
      if (!response.ok) throw new Error(value.error ?? "Не удалось войти.");
      setSession({ ...value, configured: true });
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка входа."); }
    finally { setBusy(false); }
  }
  async function logout() {
    const response = await fetch("/api/recognition/session", { method: "DELETE" });
    if (!response.ok) { setError("Не удалось завершить сеанс. Повторите выход."); return; }
    setSession(previous => previous ? { ...previous, authenticated: false } : previous);
    setFile(null); setConsent(false); setResult(null); setMessage(""); setError("");
  }
  async function example() {
    try {
      const response = await fetch("/recognition-demo.png"); if (!response.ok) throw new Error("Пример недоступен.");
      setFile(new File([await response.blob()], "Вымышленный ценник.png", { type: "image/png" }));
      setConsent(false); setResult(null); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка примера."); }
  }
  async function recognize(event: FormEvent) {
    event.preventDefault(); if (!file || !consent || busy) return;
    setBusy(true); setError(""); setResult(null); setMessage("Подготавливаем фото…");
    let received = false;
    const request = new AbortController(); controller.current = request;
    const timeout = setTimeout(() => request.abort(), 65_000);
    try {
      const image = await prepareImage(file);
      const response = await fetch("/api/recognition", { method: "POST", body: image,
        headers: { "Content-Type": "image/png", "X-Synthetic-Consent": "1" }, signal: request.signal });
      if (!response.ok) {
        const value = await response.json();
        if (response.status === 401) setSession(previous => previous ? { ...previous, authenticated: false } : previous);
        throw new Error(value.error ?? "Обработка недоступна.");
      }
      const reader = response.body?.getReader(); if (!reader) throw new Error("Пустой ответ сервера.");
      const decoder = new TextDecoder(); let pending = ""; let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length; if (size > 256 * 1024) throw new Error("Слишком большой ответ сервера.");
        pending += decoder.decode(value, { stream: true });
        let newline: number;
        while ((newline = pending.indexOf("\n")) >= 0) {
          const line = pending.slice(0, newline); pending = pending.slice(newline + 1); if (!line.trim()) continue;
          const item = JSON.parse(line);
          if (item.type === "error") throw new Error(item.error);
          if (item.type === "status") setMessage(item.message);
          if (item.type === "result") { setResult(item.result); received = true; setMessage("Готово. Проверьте текст по фото."); }
        }
      }
      if (!received) throw new Error("Сервер не вернул результат. Автоматический повтор не выполнялся.");
    } catch (e) {
      setMessage(""); setError(e instanceof Error && e.name !== "AbortError" ? e.message : "Ожидание завершено. Запрос может ещё выполняться в облаке; проверьте перед повторной отправкой.");
    } finally { clearTimeout(timeout); request.abort(); controller.current = null; setBusy(false); }
  }
  function download(kind: "json" | "csv") {
    if (!result || !file) return;
    const body = kind === "json" ? JSON.stringify({ filename: file.name, ...result }, null, 2) : recognitionCsv(file.name, result.text);
    const url = URL.createObjectURL(new Blob([body], { type: kind === "json" ? "application/json" : "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `recognition.${kind}`; link.click(); URL.revokeObjectURL(url);
  }
  if (!session) return <section className="recognition-card"><p role="status">Проверяем доступ…</p>{error && <p role="alert">{error}</p>}</section>;
  if (!session.authenticated) return <section className="recognition-card recognition-login">
    <h2>Вход в рабочий раздел</h2><p>Раздел доступен по паролю.</p>
    {!session.configured && <p role="status">Вход ещё не настроен владельцем сайта.</p>}
    <form onSubmit={login}><label htmlFor="recognition-password">Пароль</label>
      <input id="recognition-password" type="password" autoComplete="current-password" required maxLength={256}
        value={password} onChange={event => setPassword(event.target.value)} disabled={busy || !session.configured} />
      <button className="button button-primary" disabled={busy || !session.configured}>{busy ? "Проверяем…" : "Войти"}</button>
    </form>{error && <p role="alert" className="recognition-error">{error}</p>}
  </section>;
  return <div className="recognition-grid"><section className="recognition-card">
    <div className="recognition-heading"><h2>Фото ценника</h2><button type="button" className="recognition-link" onClick={logout} disabled={busy}>Выйти</button></div>
    {!session.cloudReady && <p role="status">Облачный обработчик ещё не подключён владельцем сайта.</p>}
    <p>Первый тест — одно фото одного вымышленного ценника. Проверяем качество до работы с клиентскими материалами.</p>
    <form onSubmit={recognize}>
      <label htmlFor="recognition-photo">Выберите JPEG или PNG до 25 МБ</label>
      <input id="recognition-photo" type="file" accept="image/jpeg,image/png" disabled={busy}
        onChange={event => { setFile(event.target.files?.[0] ?? null); setResult(null); setConsent(false); setMessage(""); setError(""); }} />
      <button type="button" className="recognition-link" onClick={example} disabled={busy}>Подставить вымышленный ценник</button>
      <p className="recognition-filename">{file ? file.name : "Фото пока не выбрано"}</p>
      <label className="recognition-consent"><input type="checkbox" checked={consent} disabled={busy}
        onChange={event => setConsent(event.target.checked)} /><span>Подтверждаю: изображение тестовое. Разрешаю отправить подготовленное фото в закрытый Hugging Face Space для распознавания.</span></label>
      <button className="button button-primary" disabled={!file || !consent || busy || !session.cloudReady}>{busy ? "Распознаём…" : "Распознать фото"}</button>
    </form>
    <p className="recognition-note">Фото уменьшается и отправляется без EXIF. Бесплатная очередь может потребовать ожидания. Этот раздел возвращает текст; полная таблица SKU и история ShelfData здесь пока не подключены.</p>
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="recognition-error">{error}</p>}
  </section><section className="recognition-card" aria-labelledby="recognition-result-title">
    <h2 id="recognition-result-title">Результат</h2>
    {result ? <><label htmlFor="recognition-text">Распознанный текст — проверьте по исходному фото</label>
      <textarea id="recognition-text" rows={12} value={result.text} readOnly />
      <p className="recognition-note">Обработка моделью: {result.gpu_call_seconds.toFixed(2)} с. Очередь и передача фото — дополнительно. Поля и SKU автоматически не подтверждены.</p>
      <div className="recognition-actions"><button type="button" className="button" onClick={() => download("csv")}>Скачать CSV</button><button type="button" className="button" onClick={() => download("json")}>Скачать JSON</button></div>
    </> : <p className="recognition-empty">После обработки здесь появится текст с вашего фото.</p>}
  </section></div>;
}
