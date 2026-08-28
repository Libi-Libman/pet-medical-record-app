-- Run this in the Supabase SQL editor (or `supabase db execute`) against the
-- Frankfurt project before the app can read/write `pets`.
--
-- `pets.owner_id` had no default and no foreign key, so every insert needed a
-- hand-picked UUID. This makes it default to the signed-in user instead.
-- RLS also needs to be enabled with explicit owner-scoped policies — without
-- them, Postgres denies all access by default and queries just return
-- nothing.
--
-- Copy this pattern (default auth.uid(), FK to auth.users, four owner-scoped
-- policies) for every future table that has an owner_id column: episodes,
-- events, medications, documents, weight_entries, etc.

alter table public.pets
  alter column owner_id set default auth.uid();

alter table public.pets
  add constraint pets_owner_id_fkey
  foreign key (owner_id) references auth.users (id) on delete cascade;

alter table public.pets enable row level security;

create policy "Owners can view their own pets"
  on public.pets for select
  using (auth.uid() = owner_id);

create policy "Owners can insert their own pets"
  on public.pets for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their own pets"
  on public.pets for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their own pets"
  on public.pets for delete
  using (auth.uid() = owner_id);
