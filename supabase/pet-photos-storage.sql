-- Run this in the Supabase SQL editor (or `supabase db execute`) before the
-- new "pet photo" upload feature will work (QA finding #4, live QA Oct 24
-- 2026: there was no UI anywhere to add a pet photo, despite pets.photo_url
-- already existing in the schema).
--
-- Creates a Storage bucket for pet photos and locks it down so only a pet's
-- owner can upload/replace/delete its photo. Made PUBLIC (readable by
-- anyone with the exact URL, no auth required) rather than using signed
-- URLs, because the vet-summary screen is meant to be shown to a vet on the
-- spot -- a photo stuck behind an expiring signed URL would complicate
-- that for little real privacy benefit (a pet's photo is not sensitive
-- medical data). If that tradeoff doesn't feel right given the GDPR focus
-- on this project, flip `public` to `false` below and switch the app to
-- `createSignedUrl` instead of the public URL it uses today -- just
-- know every vet-summary view will need a fresh signed URL fetch.

insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do nothing;

-- Uploaded photos are stored at `${auth.uid()}/${pet_id}.<ext>` by the app
-- (see insertPhoto in src/lib/queries/useOwnerPets.ts) -- these policies
-- check that the first path segment is the uploader's own user id, the
-- same pattern Supabase's own docs use for per-user storage folders.
create policy "Owners can upload their own pets' photos"
  on storage.objects for insert
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can replace their own pets' photos"
  on storage.objects for update
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can delete their own pets' photos"
  on storage.objects for delete
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Pet photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'pet-photos');
