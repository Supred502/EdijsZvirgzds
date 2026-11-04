-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Then run 002_folders.sql and 003_fixes.sql.
-- BEFORE running: replace 00000000-0000-0000-0000-000000000000 below with your user ID
-- (Dashboard → Authentication → Users → your user → copy "UID").

-- Only this user, logged in WITH the 2FA code (aal2), may change anything.
create or replace function public.is_owner() returns boolean
language sql stable as $$
  select (auth.jwt() ->> 'aal') = 'aal2' and auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid
$$;

-- Projects shown on the site
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title       text not null,
  tagline     text,
  body        text,                    -- Markdown write-up
  cover_url   text,
  gallery     text[] not null default '{}',
  tech        text[] not null default '{}',
  category    text not null default 'Others', -- replaced by folders in 002_folders.sql
  repo_url    text,
  live_url    text,
  featured    boolean not null default false,
  published   boolean not null default false,
  sort_order  int not null default 0,
  started_on  date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger projects_touch before update on public.projects
for each row execute function public.touch_updated_at();

-- One row: info about me
create table public.profile (
  id          int primary key default 1 check (id = 1),
  name        text,
  headline    text,
  bio         text,
  avatar_url  text,
  cv_url      text,
  socials     jsonb not null default '{}'   -- {"github": "...", "linkedin": "...", "email": "..."}
);
insert into public.profile (id, name) values (1, 'Edijs Zvirgzds');

-- Row level security: everyone reads published content, only the owner writes
alter table public.projects enable row level security;
alter table public.profile  enable row level security;

create policy "read published projects" on public.projects for select using (published or public.is_owner());
create policy "owner manages projects"  on public.projects for all using (public.is_owner()) with check (public.is_owner());
create policy "read profile"            on public.profile  for select using (true);
create policy "owner manages profile"   on public.profile  for all using (public.is_owner()) with check (public.is_owner());

-- Tables are not auto-exposed, so grant access here; the policies above still decide which rows.
grant select on public.projects, public.profile to anon, authenticated;
grant insert, update, delete on public.projects, public.profile to authenticated;

-- Image/file storage: public bucket, images + PDF (CV) only, 5 MB max, owner-only uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif','image/avif','application/pdf']);

create policy "owner uploads media" on storage.objects for insert with check (bucket_id = 'media' and public.is_owner());
create policy "owner updates media" on storage.objects for update using (bucket_id = 'media' and public.is_owner());
create policy "owner deletes media" on storage.objects for delete using (bucket_id = 'media' and public.is_owner());
