import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, deliverLead } from '../lib/leads.ts';
const valid = { name: 'Анна', contact: '+375 25 111 22 33', message: 'Нужен аудит', consent: true, page: 'https://example.by/', company: '', utm: { utm_source: 'search', bad: 'ignore' } };
test('Проверка, нормализация и сохранение источника заявки', () => {
  const result = validateLead({ ...valid, name: ' Анна ' });
  assert.equal(result.lead.name, 'Анна'); assert.deepEqual(result.lead.utm, { utm_source: 'search' });
  assert.ok(validateLead({ ...valid, contact: 'anna@company.by' }).lead);
});
test('Отказ для спама, отсутствующего согласия и неверных контактов', () => {
  for (const data of [null, [], { ...valid, website: 'spam' }, { ...valid, consent: 'true' }, { ...valid, contact: '123' }, { ...valid, contact: 'not-an-email' }, { ...valid, name: 'x'.repeat(101) }, { ...valid, message: 'x'.repeat(3001) }, { ...valid, page: 'javascript:alert(1)' }]) assert.ok(validateLead(data).error);
});
test('Автозаполнение организации в старой вкладке не отклоняет заявку', () => {
  assert.ok(validateLead({ ...valid, company: 'Название организации' }).lead);
  assert.ok(validateLead({ ...valid, company: 'Название организации', website: '' }).lead);
});
test('Нет ложного успеха, если оба канала не работают', async () => {
  assert.equal((await deliverLead(valid, { save: async () => false, notify: async () => { throw new Error('offline'); } })).accepted, false);
  assert.equal((await deliverLead(valid, {})).accepted, false);
});
test('Сбой уведомления не теряет уже сохранённую заявку', async () => {
  const result = await deliverLead(valid, { save: async lead => { assert.equal(lead.contact, valid.contact); return true; }, notify: async () => false });
  assert.deepEqual(result, { saved: true, notified: false, accepted: true });
});
test('Рабочий резервный канал и одновременная отправка в оба канала', async () => {
  assert.deepEqual(await deliverLead(valid, { save: async () => false, notify: async () => true }), { saved: false, notified: true, accepted: true });
  assert.deepEqual(await deliverLead(valid, { save: async () => true, notify: async () => true }), { saved: true, notified: true, accepted: true });
});
