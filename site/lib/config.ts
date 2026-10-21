import content from "@/content/site.json";

function canonicalUrl() {
  const value = process.env.SITE_URL;
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === "https:" ? url.origin : undefined; } catch { return undefined; }
}
function publicContact() {
  const value = process.env.CONTACT_EMAIL?.trim();
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? { href: `mailto:${value}`, label: value } : undefined;
}
export const siteConfig = { url: canonicalUrl(), contact: publicContact(), telegram: content.contacts.telegram, phone: content.contacts.phone, phoneHref: `tel:${content.contacts.phone.replace(/[^\d+]/g, "")}` };
