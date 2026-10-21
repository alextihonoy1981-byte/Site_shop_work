import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { publishedReviews } from '../lib/reviews.ts';

const review = { id: 'test-only', published: true, author: 'ТЕСТ — автор', text: 'Техническая проверка. Не настоящий отзыв.', context: 'Только для теста', service: '', sourceUrl: '' };

test('Черновик и начальный пустой шаблон не попадают на сайт', () => {
  const initial = JSON.parse(fs.readFileSync(new URL('../content/reviews.json', import.meta.url)));
  assert.equal(publishedReviews([{ ...review, published: false }]).length, 0);
  assert.ok(Array.isArray(publishedReviews(initial)));
});
test('Публикуется полный текст только выбранных записей, в порядке файла', () => {
  const result = publishedReviews([{ ...review, published: false }, { ...review, id: 'second', author: ' ТЕСТ — второй ', sourceUrl: 'https://example.com/review' }, { ...review, id: 'third' }]);
  assert.deepEqual(result.map(x => x.id), ['second', 'third']);
  assert.equal(result[0].author, 'ТЕСТ — второй');
  assert.equal(result[0].text, review.text);
  assert.equal(result[0].sourceUrl, 'https://example.com/review');
});
test('Неполная публикация и повторяющиеся ID останавливают сборку вместо потери отзывов', () => {
  for (const value of [[{ ...review, author: '' }], [{ ...review, text: '' }], [{ ...review, published: 'true' }], [review, review]]) assert.throws(() => publishedReviews(value));
});
test('В ссылках на оригинал разрешён HTTPS без учётных данных', () => {
  for (const sourceUrl of ['javascript:alert(1)', 'http://example.com', 'https://user:password@example.com']) assert.throws(() => publishedReviews([{ ...review, sourceUrl }]));
});
