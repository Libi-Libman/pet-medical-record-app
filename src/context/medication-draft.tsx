import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth';
import { useMedications, insertMedication, MedicationRow } from '@/lib/queries/useMedications';
import { useOwnerPets } from '@/lib/queries/useOwnerPets';

// Matches the product's provenance requirement: every record needs to know
// whether it was entered by the owner or extracted from a document.
export type MedicationSource = 'owner_entered' | 'extracted_from_document';

export type MedicationReminder = {
  times: string[]; // e.g. ['Morning', 'With meals']
  asNeeded: boolean;
};

export type DraftMedication = {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  source: MedicationSource;
  reminder?: MedicationReminder;
};

// A medication that's been through the full quick-add flow and had its
// reminder set — this is what the Home screen shows under "Today's
// medications". Under a real Supabase session this is persisted to the
// `medications` table (supabase/medications-table.sql) and survives a
// reload. Under the dev-only mock session there's no real Supabase JWT to
// write with, so it only lives in memory for the app session — same
// limitation as the pet-list screen.
export type ConfirmedMedication = DraftMedication & { reminder: MedicationReminder };

type NewDraftMedication = {
  name: string;
  dose: string;
  frequency: string;
  source?: MedicationSource;
};

type MedicationDraftContextType = {
  draftMeds: DraftMedication[];
  medications: ConfirmedMedication[];
  medicationsLoading: boolean;
  addDraftMed: (med: NewDraftMedication) => DraftMedication;
  updateDraftMed: (id: string, patch: Partial<Pick<DraftMedication, 'name' | 'dose' | 'frequency'>>) => void;
  getDraftMed: (id: string) => DraftMedication | undefined;
  removeDraftMed: (id: string) => void;
  setMedicationReminder: (id: string, reminder: MedicationReminder) => Promise<void>;
  nextUnconfirmedMed: (excludingId?: string) => DraftMedication | undefined;
  findDuplicateCandidate: (id: string) => DraftMedication | undefined;
  clearDraftMeds: () => void;
};

const MedicationDraftContext = createContext<MedicationDraftContextType | undefined>(undefined);

const fromRow = (row: MedicationRow): ConfirmedMedication => ({
  id: row.id,
  name: row.name,
  dose: row.dose,
  frequency: row.frequency,
  source: row.source,
  reminder: { times: row.reminderTimes, asNeeded: row.asNeeded },
});

export function MedicationDraftProvider({ children }: { children: ReactNode }) {
  const { session, isMockSession } = useAuth();
  const queryClient = useQueryClient();
  const { data: pets } = useOwnerPets();
  const currentPetId = pets?.[0]?.id;
  const [draftMeds, setDraftMeds] = useState<DraftMedication[]>([]);
  const [medications, setMedications] = useState<ConfirmedMedication[]>([]);

  // Real Supabase data for the signed-in owner. Disabled under the mock
  // session (see useMedications) — there's no real JWT to query with.
  const { data: persistedMedications, isLoading: medicationsLoading } = useMedications();

  // Hydrate local state from Supabase whenever the real, persisted list
  // changes (first load, after a mutation invalidates it, sign-in, etc).
  useEffect(() => {
    if (persistedMedications) {
      setMedications(persistedMedications.map(fromRow));
    }
  }, [persistedMedications]);

  // A signed-out user (or a different signed-in user) shouldn't keep seeing
  // whatever the previous session had in memory.
  useEffect(() => {
    if (!session) {
      setMedications([]);
      setDraftMeds([]);
    }
  }, [session]);

  const addDraftMed = (med: NewDraftMedication): DraftMedication => {
    const newMed: DraftMedication = {
      ...med,
      id: Date.now().toString(),
      source: med.source ?? 'owner_entered',
    };
    setDraftMeds((cur) => [...cur, newMed]);
    return newMed;
  };

  const updateDraftMed: MedicationDraftContextType['updateDraftMed'] = (id, patch) => {
    setDraftMeds((cur) => cur.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const getDraftMed = (id: string) => draftMeds.find((m) => m.id === id);

  const removeDraftMed = (id: string) => {
    setDraftMeds((cur) => cur.filter((m) => m.id !== id));
  };

  // Setting a reminder is what finalizes a medication: it moves out of the
  // in-progress draft list and, under a real session, gets written to
  // Supabase (`medications` table) — that's what actually persists it
  // across a reload, not just this local state. Under the mock session it
  // still finalizes locally so the flow is fully clickable during dev, it
  // just won't survive a reload.
  const setMedicationReminder = async (id: string, reminder: MedicationReminder) => {
    const med = draftMeds.find((m) => m.id === id);
    if (!med) return;

    setDraftMeds((cur) => cur.filter((m) => m.id !== id));
    setMedications((cur) => [...cur, { ...med, reminder }]);

    if (!session || isMockSession) {
      // Nothing real to persist against — dev-only mock session has no
      // Supabase JWT, so an insert would just fail RLS.
      return;
    }

    try {
      await insertMedication({
        name: med.name,
        dose: med.dose,
        frequency: med.frequency,
        source: med.source,
        reminderTimes: reminder.asNeeded ? [] : reminder.times,
        asNeeded: reminder.asNeeded,
        petId: currentPetId,
      });
      queryClient.invalidateQueries({ queryKey: ['medications', 'owner', session.user.id] });
    } catch (error) {
      // Local state already reflects the confirmed medication so the flow
      // isn't blocked, but it won't survive a reload until this succeeds —
      // surfacing this loudly (not just a console log) is worth doing once
      // there's a toast/banner pattern elsewhere in the app.
      console.error('Failed to save medication to Supabase', error);
    }
  };

  // Finds the next medication in this session that hasn't had a reminder set
  // yet — used to chain through multiple medications added in one capture,
  // and to decide when it's safe to clear the drafts.
  const nextUnconfirmedMed = (excludingId?: string) =>
    draftMeds.find((m) => m.id !== excludingId && !m.reminder);

  // A same-named medication from the *other* source, still unconfirmed —
  // the case where a medication was both entered manually and found in a
  // photo during the same capture. Name match is exact/case-insensitive for
  // now; real extraction will need fuzzier matching eventually.
  const findDuplicateCandidate = (id: string) => {
    const med = draftMeds.find((m) => m.id === id);
    if (!med) return undefined;
    return draftMeds.find(
      (m) =>
        m.id !== id &&
        !m.reminder &&
        m.source !== med.source &&
        m.name.trim().toLowerCase() === med.name.trim().toLowerCase()
    );
  };

  const clearDraftMeds = () => setDraftMeds([]);

  return (
    <MedicationDraftContext.Provider
      value={{
        draftMeds,
        medications,
        medicationsLoading,
        addDraftMed,
        updateDraftMed,
        getDraftMed,
        removeDraftMed,
        setMedicationReminder,
        nextUnconfirmedMed,
        findDuplicateCandidate,
        clearDraftMeds,
      }}
    >
      {children}
    </MedicationDraftContext.Provider>
  );
}

export function useMedicationDraft() {
  const ctx = useContext(MedicationDraftContext);
  if (!ctx) throw new Error('useMedicationDraft must be used within MedicationDraftProvider');
  return ctx;
}
