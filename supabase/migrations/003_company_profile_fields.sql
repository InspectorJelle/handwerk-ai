-- Firmen-Onboarding Felder
alter table public.users
  add column if not exists owner_name text not null default '',
  add column if not exists company_address text not null default '',
  add column if not exists company_phone text;
