-- Run this in the Supabase SQL editor.
--
-- `pets.sex` currently folds neutered/spayed status into the value itself
-- (check constraint allows 'male' | 'female' | 'male_neutered' |
-- 'female_spayed'). Per product decision, split that into two separate
-- fields instead: `sex` ('male' | 'female' only) and a new boolean
-- `sterilized` column — which also fixes a real bug: src/lib/queries/
-- useOwnerPets.ts already selects a `sterilized` column that doesn't
-- exist yet, so every pets query has been failing.
--
-- Safe to run whether or not there's existing data: any row already using
-- a compound value is backfilled into the new column before the sex
-- check constraint is tightened.

alter table public.pets add column if not exists sterilized boolean not null default false;

update public.pets
set sterilized = true,
    sex = case sex
      when 'male_neutered' then 'male'
      when 'female_spayed' then 'female'
      else sex
    end
where sex in ('male_neutered', 'female_spayed');

alter table public.pets drop constraint if exists pets_sex_check;
alter table public.pets
  add constraint pets_sex_check check (sex = any (array['male'::text, 'female'::text]));
