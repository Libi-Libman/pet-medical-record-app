import { createContext, useContext, useState, ReactNode } from 'react';

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
// medications". There's no real `medications` table yet (see task list),
// so this only lives in memory for the app session; it isn't persisted
// across a reload. That's the next real step once a Supabase table exists.
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
  addDraftMed: (med: NewDraftMedication) => DraftMedication;
  updateDraftMed: (id: string, patch: Partial<Pick<DraftMedication, 'name' | 'dose' | 'frequency'>>) => void;
  getDraftMed: (id: string) => DraftMedication | undefined;
  removeDraftMed: (id: string) => void;
  setMedicationReminder: (id: string, reminder: MedicationReminder) => void;
  nextUnconfirmedMed: (excludingId?: string) => DraftMedication | undefined;
  findDuplicateCandidate: (id: string) => DraftMedication | undefined;
  clearDraftMeds: () => void;
};

const MedicationDraftContext = createContext<MedicationDraftContextType | undefined>(undefined);

export function MedicationDraftProvider({ children }: { children: ReactNode }) {
  const [draftMeds, setDraftMeds] = useState<DraftMedication[]>([]);
  const [medications, setMedications] = useState<ConfirmedMedication[]>([]);

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
  // in-progress draft list and into `medications`, which is what Home
  // actually renders. Before this, a confirmed medication just sat in
  // draftMeds and got wiped by clearDraftMeds() at the end of the flow,
  // which is why nothing ever showed up on Home.
  const setMedicationReminder = (id: string, reminder: MedicationReminder) => {
    setDraftMeds((cur) => {
      const med = cur.find((m) => m.id === id);
      if (!med) return cur;
      setMedications((meds) => [...meds, { ...med, reminder }]);
      return cur.filter((m) => m.id !== id);
    });
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
