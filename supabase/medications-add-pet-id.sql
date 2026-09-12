-- Run this in the Supabase SQL editor, after medications-table.sql.
--
-- Adds pet_id now that Home links to a real pet (see useOwnerPets in
-- index.tsx). Nullable — existing rows and any insert made before a pet
-- exists still work; the app fills this in from the owner's first pet when
-- one is available. Revisit once multi-pet support lands (this assumes a
-- single implied pet per owner, same assumption Home makes today).

alter table public.medications
  add column if not exists pet_id uuid references public.pets (id) on delete cascade;
