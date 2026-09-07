-- Run this in the Supabase SQL editor against the Frankfurt project.
--
-- Creates the `medications` table and copies the exact owner-scoping pattern
-- from `rls-policies.sql` (pets): owner_id defaults to the signed-in user,
-- FK to auth.users, RLS enabled with four owner-scoped policies. Without
-- this, direct queries/inserts from the app will fail or return nothing.
--
-- Not linked to a specific pet yet (no pet_id) — the app only supports one
-- implied pet per owner today (see the still-open "link pet-list into Home"
-- task). Add `pet_id uuid references public.pets(id)` once that lands, and
-- extend the policies to also check pet ownership.

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  dose text not null,
  frequency text not null,
  -- Matches the product's provenance requirement: every record must say
  -- whether it was entered by the owner or extracted from a document.
  source text not null check (source in ('owner_entered', 'extracted_from_document')),
  reminder_times text[] not null default '{}',
  as_needed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.medications enable row level security;

create policy "Owners can view their own medications"
  on public.medications for select
  using (auth.uid() = owner_id);

create policy "Owners can insert their own medications"
  on public.medications for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their own medications"
  on public.medications for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their own medications"
  on public.medications for delete
  using (auth.uid() = owner_id);
