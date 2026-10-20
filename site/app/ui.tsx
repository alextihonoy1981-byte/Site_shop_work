"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
export function Header() {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!open) return; const close = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); document.getElementById("menu-toggle")?.focus(); } }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [open]);
  return <header className="header"><div className="section-wrap header-inner"><a href="#" aria-label="Маркетинговый консалтинг — главная" className="brand"><svg viewBox="0 0 56 56" fill="none" aria-hidden="true"><path d="M9 45V11h15v19l23-19v34H32V26L9 45Z" fill="currentColor" /></svg><span>Маркетинговый<br />консалтинг</span></a><button id="menu-toggle" className="menu-toggle" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>{open ? "Закрыть" : "Меню"}<span aria-hidden="true">{open ? "−" : "+"}</span></button><nav id="main-navigation" aria-label="Основная навигация" className={open ? "navigation open" : "navigation"}><a href="#services" onClick={() => setOpen(false)}>Услуги</a><a href="#consulting" onClick={() => setOpen(false)}>Подход</a><a href="#process" onClick={() => setOpen(false)}>Как работаем</a><a href="#questions" onClick={() => setOpen(false)}>Вопросы</a><a className="header-cta" href="#contact" onClick={() => setOpen(false)}>Обсудить задачу <span aria-hidden="true" className="arrow-icon" /></a></nav></div></header>;
}
export function TaskLink({ task, children }: { task: string; children: React.ReactNode }) {
  return <a className="text-link" href="#contact" onClick={() => window.dispatchEvent(new CustomEvent("choose-task", { detail: task }))}>{children}</a>;
}
export function LeadForm({ available = false }: { available?: boolean }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  useEffect(() => { const choose = (e: Event) => { setMessage((e as CustomEvent<string>).detail); setStatus("idle"); }; window.addEventListener("choose-task", choose); return () => window.removeEventListener("choose-task", choose); }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (status === "pending") return;
    const form = e.currentTarget; const data = new FormData(form); setStatus("pending"); setFeedback("");
    const params = new URLSearchParams(window.location.search);
    const utm = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].flatMap(key => params.has(key) ? [[key, params.get(key)!.slice(0, 200)]] : []));
    try {
      const response = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), contact: data.get("contact"), message, consent: data.get("consent") === "on", company: data.get("company"), page: window.location.origin + window.location.pathname, utm }), signal: AbortSignal.timeout(25000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Не удалось отправить заявку. Попробуйте ещё раз немного позже.");
      setStatus("success"); setFeedback("Заявка получена. Спасибо, что рассказали о своей задаче."); form.reset(); setMessage("");
    } catch (error) { setStatus("error"); setFeedback(error instanceof Error && error.name !== "TimeoutError" ? error.message : "Не удалось дождаться ответа. Попробуйте ещё раз немного позже."); }
  }
  return <form className="lead-form" onSubmit={submit} aria-label="Заявка на консалтинг">
    {!available && <p className="form-availability">Форма пока недоступна. Вы можете <a href="https://t.me/alexxstudio" target="_blank" rel="noopener noreferrer">написать нам в Telegram</a> или позвонить.</p>}
    <div className="form-field"><label htmlFor="name">Как к вам обращаться</label><input id="name" name="name" autoComplete="name" maxLength={100} placeholder="Ваше имя" required /></div>
    <div className="form-field"><label htmlFor="contact-value">Телефон или email</label><input id="contact-value" name="contact" autoComplete="email" maxLength={160} minLength={5} placeholder="+375 или name@company.by" required aria-describedby="contact-help" /><span id="contact-help" className="field-help">Контакт, по которому с вами удобно связаться</span></div>
    <div className="form-field"><label htmlFor="message">О чём хотите поговорить <span>необязательно</span></label><textarea id="message" name="message" maxLength={3000} rows={3} placeholder="Пару слов о вашем бизнесе и задаче" value={message} onChange={e => setMessage(e.target.value)} /></div>
    <div className="honeypot" aria-hidden="true"><label htmlFor="company">Оставьте это поле пустым</label><input id="company" name="company" tabIndex={-1} autoComplete="off" /></div>
    <label className="consent"><input type="checkbox" name="consent" required /><span>Согласен на обработку данных для ответа на обращение. <Link href="/privacy" target="_blank">Условия обработки данных<span className="sr-only"> (откроются в новой вкладке)</span></Link></span></label>
    <button className="button button-primary form-button" type="submit" disabled={status === "pending"}>{status === "pending" ? "Отправляем…" : "Отправить заявку"}<span aria-hidden="true" className="arrow-icon" /></button>
    <div className={`form-feedback ${status}`} role="status" aria-live="polite">{feedback}{status === "error" && <> <a href="https://t.me/alexxstudio" target="_blank" rel="noopener noreferrer">Написать в Telegram</a></>}</div>
  </form>;
}
