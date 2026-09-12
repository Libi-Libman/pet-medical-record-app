import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth';
import { useMedications, insertMedication, MedicationRow } from '@/lib/queries/useMedications';
import { useOwnerPets } from '@/lib/queries/useOwnerPets';
import { describeFrequency, FrequencyType } from '@/lib/medications/frequency';
import { parseDose, formatDose } from '@/lib/medications/parseDose';

// Matches the product's provenance requirement: every record needs to know
// whether it was entered by the owner or extracted from a document.
export type MedicationSource = 'owner_entered' | 'extracted_from_document';

export type MedicationReminder = {
  times: string[]; // 'HH:MM', empty when frequencyType is 'as_needed'
  frequencyType: FrequencyType;
  frequencyInterval: number | null;
};

export type DraftMedication = {
  id: string;
  name: string;
  dose: string; // free text, e.g. "75mg" — split into dose/dose_unit on save
  frequency: string; // human label, e.g. "Twice daily" — mapped to
  // frequency_type/frequency_interval on save (see getFrequencyPlan)
  source: MedicationSource;
  reminder?: MedicationReminder;
};

// A medication that's been through the full quick-add flow and had its
// reminder set — this is what the Home screen shows under "Today's
// medications". Persisted to the real `medications` table in Supabase
// under a real session (see supabase/medications-schema-notes.md); under
// the dev-only mock session there's no real Supabase JWT to write with, so
// it only lives in memory for the app session — same limitation as the
// pet-list screen.
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
  dose: formatDose(row.dose, row.doseUnit),
  frequency: describeFrequency(row.frequencyType, row.frequencyInterval),
  source: row.source,
  reminder: {
    // Postgres returns `time` as 'HH:MM:SS' — trim to 'HH:MM' to match what
    // the reminder screen writes and displays.
    times: row.reminderTimes.map((t) => t.slice(0, 5)),
    frequencyType: row.frequencyType,
    frequencyInterval: row.frequencyInterval,
  },
});

const today = () => new Date().toISOString().slice(0, 10);

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
  // in-progress draft list and, under a real session with a real pet on
  // file, gets written to Supabase (`medications` table — pet_id is
  // required there, so nothing is written until a pet exists). Local state
  // finalizes either way so the flow stays fully clickable during dev.
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

    if (!currentPetId) {
      // medications.pet_id is NOT NULL — can't write until a pet exists.
      console.warn('No pet on file yet — medication saved locally only, not to Supabase.');
      return;
    }

    try {
      const { dose, doseUnit } = parseDose(med.dose);
      await insertMedication({
        petId: currentPetId,
        name: med.name,
        dose,
        doseUnit,
        frequencyType: reminder.frequencyType,
        frequencyInterval: reminder.frequencyInterval,
        reminderTimes: reminder.times,
        startDate: today(),
        source: med.source,
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
