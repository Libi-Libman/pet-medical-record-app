# `medications` table — already exists, don't recreate it

**Do not run a `create table` migration for `medications`.** It already
exists in the real Supabase project — it predates the Supabase-only
rollback, most likely designed by the backend dev before that work stopped.
Two earlier migration files in this repo (`medications-table.sql`,
`medications-add-pet-id.sql`) assumed it didn't exist and were wrong; they
were deleted once this was discovered (Sep 12, 2026) rather than left to
mislead the next person. RLS on it is also already correct — no policy
migration is needed either.

## Real schema (confirmed via `information_schema`/`pg_constraint`, Sep 12 2026)

| column                 | type                       | nullable | default               |
| ---------------------- | -------------------------- | -------- | ---------------------- |
| `id`                   | uuid                       | no       | `uuid_generate_v4()`   |
| `pet_id`               | uuid, FK → `pets(id)` cascade | **no** | —                    |
| `episode_id`           | uuid, FK → `episodes(id)` set null | yes | —              |
| `originating_event_id` | uuid, FK → `events(id)` set null | yes | —                 |
| `name`                 | text                       | no       | —                       |
| `dose`                 | numeric                    | yes      | —                       |
| `dose_unit`            | text                       | yes      | —                       |
| `frequency_type`       | text (checked enum, below) | no       | —                       |
| `frequency_interval`   | integer                    | yes      | —                       |
| `reminder_times`       | `time without time zone[]` | no       | `'{}'`                  |
| `start_date`           | date                       | **no**   | —                       |
| `end_date`             | date                       | yes      | —                       |
| `instructions`         | text                       | yes      | —                       |
| `reason`               | text                       | yes      | —                       |
| `source`               | text (checked enum)        | no       | `'owner_entered'`       |
| `created_at`           | timestamptz                | no       | `now()`                 |

`frequency_type` check constraint: `once_daily | multiple_daily |
every_x_hours | every_x_days | weekly | monthly | as_needed | custom`.

`source` check constraint: `owner_entered | extracted_from_document` —
matches the app's provenance requirement exactly.

RLS: one `for all` policy, `owners manage medications for their pets`,
scoped through `pets`: `exists (select 1 from pets where pets.id =
medications.pet_id and pets.owner_id = auth.uid())`. This is why `pet_id`
is required (not just `owner_id` on the row itself) — ownership is proven
by owning the pet, not by a direct column.

`episodes` and `events` tables also already exist (confirmed via the FK
constraints above) — the "build out episodes/events tables" item on the
task list may be smaller than it looks; check what's actually there before
assuming it needs to be built from scratch.

## What the app does with the columns not yet exposed in the UI

- `episode_id`, `originating_event_id`: left `null`. No episode/visit
  linking flow exists yet in the quick-add screens.
- `end_date`, `instructions`, `reason`: left `null`/unset. Not captured
  anywhere in the current UI.
- `frequency_type` values `every_x_hours`, `every_x_days`, `weekly`,
  `monthly`, `custom`: not reachable from the add-medication preset picker
  (`src/lib/medications/frequency.ts`'s `FREQUENCY_PRESETS`) — only
  `once_daily`/`multiple_daily` (2x, 3x)/`as_needed` are exposed today.
  Extend that file's `PLANS` map and `FREQUENCY_PRESETS` when a screen for
  the rest gets built.

## How the app maps its own free-text fields onto this schema

- **Dose** (`src/lib/medications/parseDose.ts`): the UI still captures one
  free-text field ("75mg"). `parseDose` splits it into numeric `dose` +
  text `dose_unit` on save; `formatDose` reverses that for display. A dose
  that doesn't start with a number (parse failure) is stored entirely in
  `dose_unit` with `dose` left `null` — no data is dropped, but it won't
  sort/aggregate numerically.
- **Frequency + reminder times** (`src/lib/medications/frequency.ts`): the
  add-medication preset ("Once daily"/"Twice daily"/"Three times
  daily"/"As needed") maps to `frequency_type`/`frequency_interval` via
  `getFrequencyPlan`, and drives the intake slots shown on the reminder
  screen (e.g. "Twice daily" → Morning + Evening). Each slot has a real
  default time (08:00/13:00/20:00) that's **editable** — the reminder
  screen has an actual time picker (native `DateTimePicker`, `<input
  type="time">` on web) per intake, not just fixed presets, per explicit
  product decision (modeled loosely on MyTherapy's intake-time screen).
  `describeFrequency` reverses `frequency_type`/`frequency_interval` back
  to a label for display when hydrating a Supabase row. The review
  screen's free-text extracted frequency (e.g. "Twice daily, with food")
  is matched by keyword in `getFrequencyPlan` rather than exact string.
- **`start_date`**: not captured by any screen yet — defaults to today's
  date at save time (`medication-draft.tsx`'s `today()`). Revisit once a
  real visit/episode date exists to attach to.
