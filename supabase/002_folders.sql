-- 002: real folders (Documents → Code → PC …), notes like Aboutme.md, and locked (private) items.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.

-- Folders can sit inside folders. parent_id null = directly in Documents.
create table public.folders (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.folders(id) on delete restrict, -- can't delete a folder that has folders inside
  name        text not null check (char_length(name) between 1 and 60),
  slug        text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  color       text not null default '#ff4f9a' check (color ~ '^#[0-9a-f]{6}$'),
  icon        text not null default '' check (char_length(icon) <= 40),
  locked      boolean not null default false, -- shown on the site, contents private
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique nulls not distinct (parent_id, slug),
  check (parent_id <> id)
);

-- Text documents (Markdown), e.g. About_me/Aboutme.md
create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  folder_id   uuid references public.folders(id) on delete restrict,
  name        text not null check (char_length(name) between 1 and 80),
  slug        text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  body        text not null default '' check (char_length(body) <= 50000),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique nulls not distinct (folder_id, slug)
);

create trigger folders_touch before update on public.folders for each row execute function public.touch_updated_at();
create trigger notes_touch   before update on public.notes   for each row execute function public.touch_updated_at();

alter table public.projects
  add column folder_id uuid references public.folders(id) on delete restrict,
  add column locked boolean not null default false;

-- True when a folder, or any folder above it, is locked. Used to hide what's inside locked folders.
create or replace function public.folder_hidden(fid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  with recursive up as (
    select id, parent_id, locked from public.folders where id = fid
    union all
    select f.id, f.parent_id, f.locked from public.folders f join up on f.id = up.parent_id
  )
  select coalesce(bool_or(locked), false) from up
$$;

alter table public.folders enable row level security;
alter table public.notes   enable row level security;

-- Visitors see a locked folder itself, but nothing inside it.
create policy "read visible folders" on public.folders for select using (not public.folder_hidden(parent_id) or public.is_owner());
create policy "owner manages folders" on public.folders for all using (public.is_owner()) with check (public.is_owner());
create policy "read visible notes"   on public.notes   for select using (not public.folder_hidden(folder_id) or public.is_owner());
create policy "owner manages notes"  on public.notes   for all using (public.is_owner()) with check (public.is_owner());

-- Locked projects are no longer readable in full by visitors...
drop policy "read published projects" on public.projects;
create policy "read published projects" on public.projects for select
  using ((published and not locked and not public.folder_hidden(folder_id)) or public.is_owner());

-- ...only these harmless columns are, so the site can show them with a lock.
create view public.locked_projects as
  select id, slug, title, tagline, cover_url, tech, folder_id, sort_order, started_on, created_at, updated_at
  from public.projects
  where published and locked and not public.folder_hidden(folder_id);

grant select on public.folders, public.notes, public.locked_projects to anon, authenticated;
grant insert, update, delete on public.folders, public.notes to authenticated;

-- Move what you have now into Documents/Code/<folder>, with colours like your KDE folders
insert into public.folders (name, slug, color, icon, sort_order) values
  ('About_me', 'about-me', '#9b59b6', 'user', 0),
  ('Code', 'code', '#ff4f9a', 'code', 1);

insert into public.folders (parent_id, name, slug, color, icon, sort_order)
select (select id from public.folders where slug = 'code' and parent_id is null), c.name, c.slug, c.color, c.icon, c.ord
from (values
  ('Android',  'android',  '#9bc53d', 'smartphone', 1),
  ('Hub',      'hub',      '#2e2e2e', 'brain',      2),
  ('Others',   'others',   '#e91e63', 'shapes',     3),
  ('PC',       'pc',       '#f7941d', 'coffee',     4),
  ('Watch',    'watch',    '#ff2d6f', 'watch',      5),
  ('Websites', 'websites', '#3daee9', 'globe',      6)
) as c(name, slug, color, icon, ord);

update public.projects p set folder_id = f.id
from public.folders f
where f.name = p.category and f.parent_id = (select id from public.folders where slug = 'code' and parent_id is null);

insert into public.notes (folder_id, name, slug, body)
select id, 'Aboutme.md', 'aboutme-md', coalesce((select bio from public.profile where id = 1), '')
from public.folders where slug = 'about-me' and parent_id is null;

alter table public.projects drop column category;
