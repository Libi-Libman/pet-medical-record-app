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

type NewDraftMedication = {
  name: string;
  dose: string;
  frequency: string;
  source?: MedicationSource;
};

type MedicationDraftContextType = {
  draftMeds: DraftMedication[];
  addDraftMed: (med: NewDraftMedication) => DraftMedication;
  updateDraftMed: (id: string, patch: Partial<Pick<DraftMedication, 'name' | 'dose' | 'frequency'>>) => void;
  getDraftMed: (id: string) => DraftMedication | undefined;
  setMedicationReminder: (id: string, reminder: MedicationReminder) => void;
  nextUnconfirmedMed: (excludingId?: string) => DraftMedication | undefined;
  clearDraftMeds: () => void;
};

const MedicationDraftContext = createContext<MedicationDraftContextType | undefined>(undefined);

export function MedicationDraftProvider({ children }: { children: ReactNode }) {
  const [draftMeds, setDraftMeds] = useState<DraftMedication[]>([]);

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

  const setMedicationReminder = (id: string, reminder: MedicationReminder) => {
    setDraftMeds((cur) => cur.map((m) => (m.id === id ? { ...m, reminder } : m)));
  };

  // Finds the next medication in this session that hasn't had a reminder set
  // yet — used to chain through multiple medications added in one capture,
  // and to decide when it's safe to clear the drafts.
  const nextUnconfirmedMed = (excludingId?: string) =>
    draftMeds.find((m) => m.id !== excludingId && !m.reminder);

  const clearDraftMeds = () => setDraftMeds([]);

  return (
    <MedicationDraftContext.Provider
      value={{
        draftMeds,
        addDraftMed,
        updateDraftMed,
        getDraftMed,
        setMedicationReminder,
        nextUnconfirmedMed,
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
