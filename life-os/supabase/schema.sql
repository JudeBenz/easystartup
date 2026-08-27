-- Life OS schema — run in Supabase SQL Editor (free tier)
-- Enables phone ↔ computer realtime sync with RLS per user

create extension if not exists "pgcrypto";

-- Accounts
create table if not exists public.accounts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  balance numeric not null default 0,
  color text not null default '#2ecc71',
  updated_at timestamptz not null default now()
);

-- Transactions
create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id text not null,
  amount numeric not null,
  category text not null default '',
  note text not null default '',
  date text not null,
  type text not null,
  updated_at timestamptz not null default now()
);

-- Budget categories
create table if not exists public.budget_categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  limit_amount numeric not null default 0,
  spent numeric not null default 0,
  month text not null,
  color text not null default '#3498db',
  updated_at timestamptz not null default now()
);

-- Calendar events
create table if not exists public.events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  start_at text not null,
  end_at text not null,
  all_day boolean not null default false,
  color text not null default '#3498db',
  recurrence text,
  updated_at timestamptz not null default now()
);

-- Projects
create table if not exists public.projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'planning',
  color text not null default '#f39c12',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tasks
create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  title text not null,
  done boolean not null default false,
  due_date text,
  priority text not null default 'medium',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists accounts_user_idx on public.accounts(user_id);
create index if not exists transactions_user_idx on public.transactions(user_id);
create index if not exists budget_categories_user_idx on public.budget_categories(user_id);
create index if not exists events_user_idx on public.events(user_id);
create index if not exists projects_user_idx on public.projects(user_id);
create index if not exists tasks_user_idx on public.tasks(user_id);

-- RLS
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.budget_categories enable row level security;
alter table public.events enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

-- Policies: owner-only
do $$ begin
  create policy "accounts_own" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "transactions_own" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "budget_own" on public.budget_categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "events_own" on public.events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "projects_own" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tasks_own" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Realtime (ignore errors if table already in publication)
do $$ begin
  alter publication supabase_realtime add table public.accounts;
exception when duplicate_object then null; when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.transactions;
exception when duplicate_object then null; when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.budget_categories;
exception when duplicate_object then null; when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.events;
exception when duplicate_object then null; when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.projects;
exception when duplicate_object then null; when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null; when others then null; end $$;
