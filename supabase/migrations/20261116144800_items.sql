-- M1: clothing items + private photo storage.
-- Category, subcategory, color and pattern lists are validated in the app (src/lib/items),
-- so adding a value doesn't need a migration. Only status is fixed here.

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- items
-- ---------------------------------------------------------------------------
create table public.items (
  -- Generated in the browser before upload, so photo paths are known up front.
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  name text check (char_length(name) <= 120),
  category text not null check (char_length(category) between 1 and 40),
  subcategory text check (char_length(subcategory) <= 40),
  colors text[] not null default '{}' check (cardinality(colors) <= 6),
  pattern text check (char_length(pattern) <= 40),
  brand text check (char_length(brand) <= 80),
  size text check (char_length(size) <= 40),
  status text not null default 'clean'
    check (status in ('clean', 'in_wash', 'lent', 'archived')),
  notes text check (char_length(notes) <= 1000),

  -- false when the user chose "Keep background" (all photos made from the original).
  has_cutout boolean not null default true,

  -- Storage paths inside the private "items" bucket: <user_id>/<item_id>/<file>.webp
  original_path text not null,
  cutout_path text not null,
  thumb_path text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A row may only point at photos in its own user's and item's folder.
  constraint items_paths_in_own_folder check (
    original_path like user_id::text || '/' || id::text || '/%'
    and cutout_path like user_id::text || '/' || id::text || '/%'
    and thumb_path like user_id::text || '/' || id::text || '/%'
  )
);

-- Closet grid: newest first, per user.
create index items_user_created_idx on public.items (user_id, created_at desc);

create trigger items_set_updated_at
  before update on public.items
  for each row
  execute function public.set_updated_at();

alter table public.items enable row level security;

create policy "Users can read their own items"
  on public.items
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own items"
  on public.items
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own items"
  on public.items
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own items"
  on public.items
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.items from anon;
grant select, insert, update, delete on public.items to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private "items" bucket, WebP only, max 5 MB per file
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('items', 'items', false, 5242880, array['image/webp']);

-- Users can only touch files inside their own <user_id>/ folder.
create policy "Users can read their own item photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'items'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can upload their own item photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'items'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update their own item photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'items'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'items'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own item photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'items'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
