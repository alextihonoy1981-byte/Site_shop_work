function canonicalUrl() {
  const value = process.env.SITE_URL;
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === "https:" ? url.origin : undefined; } catch { return undefined; }
}
function publicContact() {
  const value = process.env.CONTACT_EMAIL?.trim();
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? { href: `mailto:${value}`, label: value } : undefined;
}
export const siteConfig = { url: canonicalUrl(), contact: publicContact(), telegram: "https://t.me/alexxstudio", phone: "+375 25 533 10 12", phoneHref: "tel:+375255331012" };
