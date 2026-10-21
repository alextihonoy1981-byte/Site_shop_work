export type Review = {
  id: string;
  author: string;
  context: string;
  text: string;
  service: string;
  sourceUrl: string;
};

export function publishedReviews(input: unknown): Review[] {
  if (!Array.isArray(input)) throw new Error("Отзывы должны быть массивом записей.");
  const ids = new Set<string>();
  return input.flatMap((value, index) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Отзыв ${index + 1}: неверный формат.`);
    const item = value as Record<string, unknown>;
    if (typeof item.published !== "boolean") throw new Error(`Отзыв ${index + 1}: published должен быть true или false.`);
    if (!item.published) return [];
    const field = (key: string, max: number, required = false) => {
      const value = item[key];
      if (value !== undefined && typeof value !== "string") throw new Error(`Отзыв ${index + 1}: ${key} должен быть текстом.`);
      const text = typeof value === "string" ? value.trim() : "";
      if ((required && !text) || text.length > max) throw new Error(`Отзыв ${index + 1}: проверьте ${key} (до ${max} символов).`);
      return text;
    };
    const id = field("id", 100, true);
    if (ids.has(id)) throw new Error(`Отзыв ${index + 1}: id не должен повторяться.`);
    ids.add(id);
    const sourceUrl = field("sourceUrl", 2000);
    if (sourceUrl) {
      try {
        const url = new URL(sourceUrl);
        if (url.protocol !== "https:" || url.username || url.password) throw new Error();
      } catch { throw new Error(`Отзыв ${index + 1}: sourceUrl должен быть публичной HTTPS-ссылкой.`); }
    }
    return [{ id, author: field("author", 100, true), context: field("context", 160), text: field("text", 3000, true), service: field("service", 100), sourceUrl }];
  });
}
