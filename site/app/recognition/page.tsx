import type { Metadata } from "next";
import { Header } from "@/app/ui";
import { RecognitionWorkspace } from "./workspace";
import "./recognition.css";

export const metadata: Metadata = { title: "Распознавание — маркетинговый консалтинг",
  description: "Закрытый рабочий раздел распознавания ценников.",
  robots: { index: false, follow: false }, alternates: { canonical: "/recognition" } };

export default function RecognitionPage() {
  return <><Header /><main id="main" className="section-wrap recognition-page">
    <p className="section-label">Рабочие инструменты · ShelfData</p>
    <h1>Распознавание</h1>
    <p className="recognition-intro">Загрузите фото ценника, получите текст и проверьте результат перед использованием.</p>
    <RecognitionWorkspace />
  </main></>;
}
