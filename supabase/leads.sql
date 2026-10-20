-- Выполните в SQL Editor своего проекта Supabase.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 100),
  contact text not null check (char_length(contact) between 5 and 160),
  message text not null default '' check (char_length(message) <= 3000),
  page text not null default '' check (char_length(page) <= 2000),
  utm jsonb not null default '{}'::jsonb,
  consent boolean not null check (consent = true),
  consent_version text not null default '2026-10-20'
);
alter table public.leads enable row level security;
-- Публичных политик нет. Запись и чтение доступны только серверу.
revoke all on table public.leads from anon, authenticated;
