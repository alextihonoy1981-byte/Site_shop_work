import type { Metadata } from "next";
import localFont from "next/font/local";
import { siteConfig } from "@/lib/config";
import "./globals.css";
const manrope = localFont({ src: "../public/fonts/manrope-variable.ttf", display: "swap", variable: "--font-manrope", weight: "200 800" });
export const metadata: Metadata = {
  title: "Маркетинговый консалтинг в Минске и Беларуси",
  description: "Маркетинговый консалтинг для малого и среднего бизнеса в Минске и Беларуси. Обсудим вашу задачу и возможные следующие шаги. Оставьте заявку для связи.",
  ...(siteConfig.url ? { metadataBase: new URL(siteConfig.url), alternates: { canonical: "/" } } : {}),
  openGraph: { title: "Ясность в маркетинге. Опора для решений.", description: "Консалтинг для малого и среднего бизнеса в Минске и Беларуси", type: "website", locale: "ru_BY", ...(siteConfig.url ? { url: siteConfig.url, images: [{ url: `${siteConfig.url}/og.png`, width: 1200, height: 630, alt: "Маркетинговый консалтинг в Минске и Беларуси" }] } : {}) },
  twitter: { card: "summary_large_image", ...(siteConfig.url ? { images: [`${siteConfig.url}/og.png`] } : {}) },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru" className={manrope.variable}><body><a href="#main" className="skip-link">К содержанию</a>{children}</body></html>;
}
