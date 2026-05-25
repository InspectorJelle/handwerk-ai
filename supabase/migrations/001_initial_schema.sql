-- Handwerk.ai initial schema
create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key default gen_random_uuid(),
  company_name text not null default '',
  logo_url text,
  tax_id text,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  address text not null default '',
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create type public.quote_status as enum ('draft', 'sent');

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete restrict,
  quote_number text not null,
  status public.quote_status not null default 'draft',
  total_cents integer not null default 0,
  items jsonb not null default '[]'::jsonb,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quotes_user_id_created_at_idx on public.quotes (user_id, created_at desc);

-- Dev seed user (matches DEV_USER_ID in .env.local.example)
insert into public.users (id, company_name, tax_id)
values (
  '00000000-0000-4000-8000-000000000001',
  'Muster Handwerk GmbH',
  'DE123456789'
)
on conflict (id) do nothing;

-- RLS enabled; policies in Phase 2 (service role bypasses RLS)
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.quotes enable row level security;
