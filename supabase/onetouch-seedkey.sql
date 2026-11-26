-- 원터치화 1단계 · 시드 재적용용 키 (2026-11-26)
alter table public.competitions add column if not exists seed_key text;
alter table public.it_news add column if not exists seed_key text;
create unique index if not exists competitions_seed_key_key on public.competitions (seed_key);
create unique index if not exists it_news_seed_key_key on public.it_news (seed_key);
