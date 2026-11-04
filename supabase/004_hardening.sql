-- 004: security hardening from the pre-public audit.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.

-- 1. The locked_projects view runs with owner rights (so visitors can see a locked project's title and cover).
--    Make sure nobody but the owner's own tables can ever be written through it, whatever Supabase's default grants are.
revoke insert, update, delete, truncate on public.locked_projects from public, anon, authenticated;
alter view public.locked_projects set (security_barrier = true);

-- 2. Let the owner list their own uploads, so deleting a project also removes its images.
--    Visitors still can't list the bucket (public URLs keep working as before).
create policy "owner lists media" on storage.objects for select
  using (bucket_id = 'media' and public.is_owner());

-- 3. Stop the "is this folder locked?" walk looping forever if folders ever point at each other.
create or replace function public.folder_hidden(fid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  with recursive up as (
    select id, parent_id, locked from public.folders where id = fid
    union
    select f.id, f.parent_id, f.locked from public.folders f join up on f.id = up.parent_id
  )
  select coalesce(bool_or(locked), false) from up
$$;
