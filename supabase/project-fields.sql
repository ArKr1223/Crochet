begin;
alter table public.projects
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists work_type text,
  add column if not exists yarn_description text,
  add column if not exists tool_type text check (tool_type in ('棒針', '鉤針')),
  add column if not exists hook_size text;
notify pgrst, 'reload schema';
commit;
