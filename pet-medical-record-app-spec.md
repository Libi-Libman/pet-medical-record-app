# Pet medical record app — product spec

Status: product definition + UX design complete, validated informally with other pet owners. Technical stack and build not yet started.
Last updated: 11 Aug 2026

## 1. Core problem

Not "how do I remember my dog's vaccinations." The real problem: how does an owner keep track of a pet's complete medical story, understand what happened and when, manage current treatment, and quickly explain the relevant history to a vet who has never seen the pet before.

This product is built specifically for pets with complex, chronic, or recurring medical issues — not general pet wellness. That distinction drives every scope decision below.

**Primary user**: a highly involved owner managing an animal with significant or ongoing medical needs (chronic conditions, multiple diagnoses, past surgeries, several medications, multiple vets/specialists, recurring emergency visits). The app should still work for a healthy pet, but it's optimized for the complicated case.

**Geographic context**: Germany/EU. Considerations to carry forward: GDPR, German/English language support, sharing records without requiring the vet to install anything, no dependency on veterinary-system integrations for MVP.

**Positioning** (not finalized): "A medical record designed for pets with complicated health histories" / "Your pet's medical story, organized for you and understandable to any vet." Differentiator from existing pet health record apps: this is complex medical care management, not a general digital record.

## 2. Product principles

- Fast to update — recording a visit should take very little effort.
- Useful during stressful situations — important information accessible within seconds.
- Owner-controlled — the owner always manages and can access the record.
- History never disappears — old diagnoses, meds, and visits stay available, just decluttered from the current view.
- Structured but flexible — organized without forcing every situation into a rigid form.
- Mobile-first — main use case is a phone, often at a vet clinic.
- Trustworthy — owner-entered, vet-document-extracted, and AI-suggested information must always be visually distinguishable.

## 3. Core concept: Medical Episodes

A **Medical Episode** represents one medical problem and its story over time (example: "Right cruciate ligament rupture" — limping noticed, exam, diagnosis, surgery, complication, recovery, all as one thread). This sits alongside the flat chronological timeline:

- The **timeline** answers "what happened over the pet's life."
- The **episode** answers "what happened with this particular problem."

An episode is deliberately thin — mostly metadata and links, not a duplicate data store. It holds: name, status, category, onset/resolution dates, and an owner-editable one-line current-status note. Everything else (visits, meds, procedures, documents) is referenced, not owned, by the episode — this is what keeps re-tagging and merging cheap instead of turning into taxonomy maintenance.

An event can belong to zero, one, or several episodes (many-to-many). Not every event needs an episode — routine/unrelated events (annual checkup, vaccination) stay unlinked.

**Current vs. historical**: active/chronic conditions, current meds, recent complications, and upcoming follow-ups should be visually front-and-center; resolved issues, completed medication courses, and old visits remain fully accessible but don't clutter the current clinical picture.

**Edge cases identified, deferred to real-world testing rather than solved in the design**: multi-episode events, ambiguous causality (is a complication its own episode or part of the parent?), episodes without a clean diagnosis yet, retroactive re-tagging when understanding changes, chronic conditions with flare-ups (kept as one episode, not one per flare), resolved conditions that recur (reopen vs. new episode), medication treating two episodes at once.

## 4. Data model

**Pet** — id, name, species, breed, sex, birth_date, microchip_number, photo_url, primary_contact_id.

**Episode** — id, pet_id, name, category (optional: orthopedic, GI, dermatology, cardiac, neuro, dental...), status (active / chronic_active / monitoring / resolved), onset_date, resolution_date, current_status_note.

**Event** — the single table behind the whole timeline. id, pet_id, type (visit / note / procedure / test / appointment), date, date_precision (exact / month / year), clinic_name, notes, symptoms, findings, diagnosis, treatment, source (owner_entered / extracted_from_document), status (mainly for appointments). One table with a type flag rather than five separate tables, so the timeline stays a single sortable list and a quick note and a full vet visit fit the same row.

**EpisodeEvent** — join table (episode_id, event_id). Lets one visit belong to two conditions and makes re-tagging a matter of adding/removing a row.

**Medication** — id, pet_id, name, dose, dose_unit, frequency_type (once_daily / multiple_daily / every_x_hours / every_x_days / weekly / monthly / as_needed / custom), start_date, end_date (null = ongoing), instructions, reason, episode_id (nullable), originating_event_id (nullable), source. Plus **MedicationDoseChange** (medication_id, date, new_dose, note) for dose history within one course.

**Document** — id, pet_id, event_id (nullable — null means unsorted/flat list), file_url, type, extraction_status, extracted_data, confirmed (bool). Only becomes part of the structured record once the owner confirms it.

**Global, non-episodic tables**: Allergy/Reaction (substance, reaction, severity, source_event_id), Vaccination (name, date_given, valid_until, clinic), WeightEntry (date, weight_kg, source — a time series, not a single field), Contact (name, clinic, role, specialty, is_primary).

**Computed, never stored**: "current medications" and "active conditions" are queries (meds with no end_date or a future one; episodes with active/chronic/monitoring status), not fields the owner maintains separately. The vet-facing summary is assembled the same way at generation time.

**Provenance**: the `source` field on Event, Medication, and Document (owner_entered vs. extracted_from_document) is a first-class column, not a UI-only label — it survives exports and the vet summary too, and is what powers the "from document" tags in the UI.

## 5. Key flow: quick-add + AI extraction

Design constraint that overrides everything else: capture must be at least as fast as the paper notebook, or the app dies within a month.

**Step 1 — capture (under ~15 seconds)**: one "+" button, one screen. Date (defaults today) + a single free-text box ("What happened?") + inline camera icon to attach a photo. Save is active with text alone, photo alone, or both — nothing else required. No episode picker, no clinic field, no tags at this stage.

**Step 2 — enrichment, always after save, never before, always optional**: if a photo was attached, AI extraction runs in the background (never blocks the save — clinic wifi is unreliable). A badge appears when ready: "We found details in your photo — review?" The review screen shows each extracted field (visit date, clinic, diagnosis, medications with dose/frequency/duration) individually editable and tagged "from document." Multiple medications in one letter are each independently confirmable — not all-or-nothing.

**Step 3 — medication confirmation feeds reminders directly**: when a medication is confirmed (extracted or manual), if it has a real schedule the app asks for reminder time using presets (morning / evening / with meals / custom) rather than a blank time picker. As-needed/PRN medications get no reminder at all. Reminders always derive from the medication's own start/end dates — never a separately configured schedule — so a completed course stops reminding automatically.

**Safety rule**: nothing extracted by AI ever populates a reminder without explicit owner confirmation. Handwritten German discharge letters will have inconsistent OCR accuracy; a wrong dose reminder is a safety issue, not a cosmetic one.

**AI's role generally**: administrative assistant, not a veterinarian. Document extraction and summary generation only — no AI diagnosis. Extracted data is always owner-reviewable/editable and always visually distinguished from owner-entered or vet-provided data. Source documents stay linked to whatever structured data they produced.

**Privacy note carried forward, not yet resolved**: a photographed discharge letter contains clinic and owner-identifying info. If extraction runs through a cloud AI call, that's a GDPR-relevant data flow to decide deliberately (EU-hosted processing, disclosed in a privacy policy) before launch.

## 6. Screens designed

1. **Home** — the owner's page. Pet header, two quick actions (Add entry, Vet summary), "How she's doing" (active episode cards), today's medications checklist, upcoming appointment, recent activity preview. Deliberately warmer and more colorful than the clinical screens — this is Luna's page, not the vet's.
2. **Quick-add capture** — the 15-second entry screen described above.
3. **Document review** — post-save, optional, shows AI-extracted fields tagged by source, editable before confirming.
4. **Medication reminder setup** — per-medication, preset time chips + as-needed toggle.
5. **Episode detail** — episode name, status, category, onset date, editable current-status note, linked timeline events (icon per type: note / visit / procedure / complication), linked medications (with completed/active status), linked documents.
6. **Full timeline** — flat chronological view of every event across all episodes, filterable by episode via chips, each row showing its episode tag (or none, if unlinked) and complications flagged in red. Answers "what happened over the pet's life," complementing the episode view.
7. **Vet-facing summary** — the core "new vet in 30–60 seconds" screen. Order: header (name/breed/sex/age/weight/microchip) → allergies (flagged, top — safety-critical) → current medications table → active conditions (one-line rollups only, not full episode stories) → current restrictions → surgical history → recent clinical events (~90 days) → primary vet contact → link to full record. One well-designed version, not multiple length tiers.

**Navigation**: Home is the hub — "+ Add entry" opens quick-add; tapping a condition card opens episode detail; "Vet summary" button opens the summary; "View all" opens the full timeline. Quick-add chains capture → document review (if a photo was attached) → medication reminder (per medication). Not yet designed: dedicated detail screens for tapping an individual medication or document from within episode detail.

## 7. Design system — color language

Locked after a consistency pass across all screens:

| Color  | Meaning                                                                    |
| ------ | -------------------------------------------------------------------------- |
| Amber  | Condition actively being treated or recovering                             |
| Green  | Chronic condition, stable and well managed                                 |
| Purple | Medications — consistently, on every screen                                |
| Blue   | Actions, navigation, links, AI-extracted data tags, current/ongoing status |
| Red    | Allergies, complications, anything safety-critical                         |
| Gray   | Structural: categories, completed items, chrome                            |

All tint/text pairings were checked against WCAG AA (4.5:1 for normal text) and passed with substantial margin (6.2:1–9.0:1) in both light and dark mode using the platform's tint-background + darkest-stop-text convention. Re-verify against the actual brand hex values once those are chosen during implementation — this validated the pattern, not final pixel colors.

The two structural/technical diagrams used during this design process (entity relationship map, screen navigation map) intentionally use a separate documentation palette — they're references for us, not in-app screens, so they don't need to follow the product's own color system.

## 8. MVP scope

1. Pet profile (minimal fields).
2. Timeline with true quick-add (date + free text, zero required linking).
3. Lightweight Episodes (create, status, retroactive link/unlink, editable status note).
4. Global pinned data: allergies, vaccinations, primary vet contact.
5. Medications: optional episode/visit link, current-vs-history computed automatically, reminders for daily / every-X-hours / course patterns (monthly injections etc. deferred).
6. Documents: event-attached, plus a flat fallback list for anything unsorted.
7. Auto-generated vet-facing summary (screen + exportable, e.g. PDF).
8. Appointments as episode-linkable future timeline entries.

**Deliberately deferred, not cut** — AI document extraction (highest-leverage feature for keeping entry effortless on a complex case, but a fast-follow once the core loop is validated, not day one); auto-suggested episode linking; split/merge tooling; multi-user/family access; customizable summary formats.

**Explicitly out of scope unless it directly supports complex medical care**: activity tracking, pet social features, breed content, training, food recommendations, grooming, shopping, wellness scores, AI symptom diagnosis, veterinary-system integrations.

## 9. Validated so far

Concept and screens shown informally to other pet owners managing pets with ongoing medical needs — positive reception. No structured usability testing yet.

## 10. Open questions / next steps

- Technical stack: native app vs. PWA. This decision gates push notification reliability and offline support for reminders, both core to the product — needs to happen before build work starts.
- GDPR/data residency decision for AI extraction (cloud vs. on-device/EU-hosted).
- German-language support for the owner UI and the vet-facing summary.
- Final marketing positioning/name.
- Structured usability testing beyond informal owner feedback.
- Edge cases listed in Section 3, to be resolved through real usage rather than upfront design.
