import { createContext, useContext, useState, ReactNode } from 'react';

export type DraftMedication = {
  id: string;
  name: string;
  dose: string;
  frequency: string;
};

type MedicationDraftContextType = {
  draftMeds: DraftMedication[];
  addDraftMed: (med: Omit<DraftMedication, 'id'>) => void;
  clearDraftMeds: () => void;
};

const MedicationDraftContext = createContext<MedicationDraftContextType | undefined>(undefined);

export function MedicationDraftProvider({ children }: { children: ReactNode }) {
  const [draftMeds, setDraftMeds] = useState<DraftMedication[]>([]);

  const addDraftMed = (med: Omit<DraftMedication, 'id'>) => {
    setDraftMeds((cur) => [...cur, { ...med, id: Date.now().toString() }]);
  };

  const clearDraftMeds = () => setDraftMeds([]);

  return (
    <MedicationDraftContext.Provider value={{ draftMeds, addDraftMed, clearDraftMeds }}>
      {children}
    </MedicationDraftContext.Provider>
  );
}

export function useMedicationDraft() {
  const ctx = useContext(MedicationDraftContext);
  if (!ctx) throw new Error('useMedicationDraft must be used within MedicationDraftProvider');
  return ctx;
}