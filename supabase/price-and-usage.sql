begin;
alter table public.yarns add column if not exists is_used boolean not null default false;
alter table public.patterns add column if not exists price numeric(12, 2) check (price >= 0);
commit;
