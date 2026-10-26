-- Lets a signed-in user record "please delete my account" from inside the
-- app. This does NOT delete anything by itself — it's the in-app
-- initiation step App Store Review Guideline 5.1.1(v) requires (account
-- deletion must be *initiated* in the app; the actual processing is
-- allowed to be manual/deferred as long as you tell the person how long
-- it'll take and confirm once it's done).
--
-- Processing a request today means: you (the developer) see the row,
-- manually delete the person's data from pets/episodes/events/allergies/
-- contacts/medications/documents/vaccinations/weight_entries/etc. for that
-- owner_id, then delete the auth.users row (Supabase dashboard -> 
-- Authentication -> Users -> delete), then set processed_at on this row.
-- A one-click in-app cascade-delete can be built later once every table's
-- real foreign-key/cascade behavior is confirmed (see repo-audit notes —
-- deliberately not guessed at here).

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.account_deletion_requests enable row level security;

-- A user can file a request for themselves...
create policy "Users can request deletion of their own account"
  on public.account_deletion_requests for insert
  with check (owner_id = auth.uid());

-- ...and see their own past request(s), e.g. to show "pending" in the UI.
create policy "Users can view their own deletion requests"
  on public.account_deletion_requests for select
  using (owner_id = auth.uid());

-- No update/delete policy for regular users on purpose — only you,
-- working directly in the Supabase dashboard/SQL editor as the project
-- owner, should mark a request processed or remove it.
