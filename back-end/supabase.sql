-- =========================================================
-- CONEXÃO SONORA — Estrutura do banco (Supabase / Postgres)
-- Cole no SQL Editor do Supabase e execute.
-- =========================================================

-- ---------- Tabelas ----------
create table if not exists releases (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title      text not null,
  year       int  not null check (year between 1900 and 2100),
  cover_url  text,
  created_at timestamptz not null default now()
);

create table if not exists tracks (
  id         uuid primary key default gen_random_uuid(),
  release_id uuid not null references releases(id) on delete cascade,
  position   int  not null,
  name       text not null,
  duration   text,
  link       text
);

create index if not exists tracks_release_id_idx on tracks(release_id);
create index if not exists releases_user_id_idx  on releases(user_id);

-- ---------- Row Level Security ----------
alter table releases enable row level security;
alter table tracks   enable row level security;

create policy "dono gerencia seus lançamentos" on releases
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "dono gerencia suas faixas" on tracks
  for all
  using (exists (
    select 1 from releases r
    where r.id = tracks.release_id and r.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from releases r
    where r.id = tracks.release_id and r.user_id = auth.uid()
  ));

-- ---------- Storage (capas) ----------
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Cada usuário só grava/altera/apaga dentro da própria pasta (<user_id>/arquivo.ext)
create policy "upload na propria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "update na propria pasta" on storage.objects
  for update to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "delete na propria pasta" on storage.objects
  for delete to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);