-- 003: reordering or toggling Published/Featured no longer counts as an edit.
-- (Otherwise "Modified", "Latest updates" and "Recent" would all show today after a drag.)
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  if (to_jsonb(new) - 'updated_at' - 'sort_order' - 'published' - 'featured')
     is distinct from (to_jsonb(old) - 'updated_at' - 'sort_order' - 'published' - 'featured') then
    new.updated_at = now();
  end if;
  return new;
end $$;
