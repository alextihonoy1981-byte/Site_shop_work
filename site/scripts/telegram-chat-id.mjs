import { existsSync } from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.error('Добавьте TELEGRAM_BOT_TOKEN в .env.local. Не присылайте токен в чат.'); process.exit(1); }
try {
  const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, { signal: AbortSignal.timeout(10000) });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error('request_failed');
  const chats = new Map(result.result.flatMap(item => item.message?.chat ? [[item.message.chat.id, item.message.chat]] : []));
  if (!chats.size) console.log('Откройте своего бота, нажмите Start и запустите команду снова.');
  for (const [id, chat] of chats) console.log(`chat_id: ${id}; название: ${chat.title || chat.first_name || 'Личный чат'}`);
} catch { console.error('Не удалось получить список чатов. Проверьте доступ к api.telegram.org и настройки бота.'); process.exit(1); }
