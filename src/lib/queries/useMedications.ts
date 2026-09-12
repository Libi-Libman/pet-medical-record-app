import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import type { MedicationSource } from '@/context/medication-draft';
import type { FrequencyType } from '@/lib/medications/frequency';

// Matches the real `medications` table already in Supabase (predates this
// rollback — it was designed with a richer shape than a first pass would
// guess at: pet_id is required, dose is split into dose/dose_unit,
// frequency is structured (frequency_type/frequency_interval), and
// reminder_times is a real time[] column, not text labels). See
// supabase/medications-schema-notes.md for the full column reference and
// where each field's owning screen is.
export type MedicationRow = {
  id: string;
  petId: string;
  name: string;
  dose: number | null;
  doseUnit: string | null;
  frequencyType: FrequencyType;
  frequencyInterval: number | null;
  reminderTimes: string[]; // 'HH:MM:SS' as returned by Postgres for `time`
  startDate: string; // 'YYYY-MM-DD'
  source: MedicationSource;
  createdAt: string;
};

const SELECT_COLUMNS =
  'id, petId:pet_id, name, dose, doseUnit:dose_unit, frequencyType:frequency_type, frequencyInterval:frequency_interval, reminderTimes:reminder_times, startDate:start_date, source, createdAt:created_at';

// Real, persisted medications from Supabase — RLS scopes every query to the
// signed-in owner's own pets automatically (policy joins through pets.owner_id).
export const useMedications = () => {
  const { session, isMockSession } = useAuth();

  return useQuery({
    queryKey: ['medications', 'owner', session?.user.id],
    enabled: !!session && !isMockSession,
    queryFn: async (): Promise<MedicationRow[]> => {
      const { data, error } = await supabase
        .from('medications')
        .select(SELECT_COLUMNS)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as MedicationRow[];
    },
  });
};

export const insertMedication = async (input: {
  petId: string;
  name: string;
  dose: number | null;
  doseUnit: string | null;
  frequencyType: FrequencyType;
  frequencyInterval: number | null;
  reminderTimes: string[];
  startDate: string;
  source: MedicationSource;
}): Promise<MedicationRow> => {
  const { data, error } = await supabase
    .from('medications')
    .insert({
      pet_id: input.petId,
      name: input.name,
      dose: input.dose,
      dose_unit: input.doseUnit,
      frequency_type: input.frequencyType,
      frequency_interval: input.frequencyInterval,
      reminder_times: input.reminderTimes,
      start_date: input.startDate,
      source: input.source,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return data as unknown as MedicationRow;
};
