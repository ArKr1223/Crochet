create table if not exists public.yarns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  color text,
  color_hex text,
  material text,
  weight text,
  yardage text,
  quantity integer not null default 1 check (quantity >= 0),
  price text,
  purchase_place text,
  notes text,
  storage text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  source_type text check (source_type in ('photo', 'website', 'pdf')),
  source_url text,
  image_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pattern_yarns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_id uuid not null references public.patterns(id) on delete cascade,
  yarn_id uuid not null references public.yarns(id) on delete cascade,
  usage_amount text,
  created_at timestamptz not null default now(),
  unique (pattern_id, yarn_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_id uuid references public.patterns(id) on delete set null,
  name text not null,
  status text not null default '進行中',
  progress integer not null default 0 check (progress between 0 and 100),
  current_step text,
  image_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.yarns enable row level security;
alter table public.patterns enable row level security;
alter table public.pattern_yarns enable row level security;
alter table public.projects enable row level security;

create policy "Users can read their yarns"
  on public.yarns for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their yarns"
  on public.yarns for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their yarns"
  on public.yarns for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their yarns"
  on public.yarns for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their patterns"
  on public.patterns for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their patterns"
  on public.patterns for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their patterns"
  on public.patterns for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their patterns"
  on public.patterns for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their pattern yarn links"
  on public.pattern_yarns for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their pattern yarn links"
  on public.pattern_yarns for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their pattern yarn links"
  on public.pattern_yarns for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their pattern yarn links"
  on public.pattern_yarns for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their projects"
  on public.projects for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their projects"
  on public.projects for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their projects"
  on public.projects for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their projects"
  on public.projects for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists yarns_user_id_idx on public.yarns(user_id);
create index if not exists patterns_user_id_idx on public.patterns(user_id);
create index if not exists pattern_yarns_pattern_id_idx on public.pattern_yarns(pattern_id);
create index if not exists pattern_yarns_yarn_id_idx on public.pattern_yarns(yarn_id);
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_pattern_id_idx on public.projects(pattern_id);
