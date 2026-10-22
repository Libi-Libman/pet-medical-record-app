-- Run this in the Supabase SQL editor.
--
-- `active_episodes` and `current_medications` are plain views (not
-- materialized) over `episodes` and `medications`, both of which have RLS
-- enabled and scoped to the owning pet. By default, though, a Postgres view
-- runs with the *view owner's* privileges, not the querying user's —
-- meaning RLS on the underlying table can be silently bypassed depending on
-- who owns the view (a well-known Supabase gotcha, not specific to this
-- project). `security_invoker = true` makes the view respect the querying
-- user's own RLS instead, so these behave exactly like querying the base
-- table directly. Safe to run regardless of whether the bypass was actually
-- happening — this is the correct setting either way.

alter view public.active_episodes set (security_invoker = true);
alter view public.current_medications set (security_invoker = true);
