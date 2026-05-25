-- Auth trigger + RLS policies (Handwerk.ai Phase 2)
-- Im Supabase SQL Editor ausführen, wenn Auth aktiv ist.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, company_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'company_name', '')
  )
  on conflict (id) do update
    set company_name = excluded.company_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: Nutzer sehen nur eigene Daten
create policy users_insert_own on public.users
  for insert with check (auth.uid() = id);

create policy users_select_own on public.users
  for select using (auth.uid() = id);
create policy users_update_own on public.users
  for update using (auth.uid() = id);

create policy customers_all_own on public.customers
  for all using (auth.uid() = user_id);

create policy quotes_all_own on public.quotes
  for all using (auth.uid() = user_id);

-- Storage Buckets (im Dashboard anlegen oder per SQL):
-- 1. logos (public) – Firmenlogos
-- 2. quote-pdfs (public) – generierte PDFs
