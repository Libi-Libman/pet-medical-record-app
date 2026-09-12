import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import type { MedicationSource } from '@/context/medication-draft';

export type MedicationRow = {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  source: MedicationSource;
  reminderTimes: string[];
  asNeeded: boolean;
  createdAt: string;
  petId: string | null;
};

// Real, persisted medications from Supabase (see
// supabase/medications-table.sql) — RLS scopes every query to the signed-in
// owner automatically, same pattern as useOwnerPets.
export const useMedications = () => {
  const { session, isMockSession } = useAuth();

  return useQuery({
    queryKey: ['medications', 'owner', session?.user.id],
    enabled: !!session && !isMockSession,
    queryFn: async (): Promise<MedicationRow[]> => {
      const { data, error } = await supabase
        .from('medications')
        .select(
          'id, name, dose, frequency, source, reminderTimes:reminder_times, asNeeded:as_needed, createdAt:created_at, petId:pet_id'
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as MedicationRow[];
    },
  });
};

export const insertMedication = async (input: {
  name: string;
  dose: string;
  frequency: string;
  source: MedicationSource;
  reminderTimes: string[];
  asNeeded: boolean;
  petId?: string;
}): Promise<MedicationRow> => {
  const { data, error } = await supabase
    .from('medications')
    .insert({
      name: input.name,
      dose: input.dose,
      frequency: input.frequency,
      source: input.source,
      reminder_times: input.reminderTimes,
      as_needed: input.asNeeded,
      pet_id: input.petId ?? null,
    })
    .select(
      'id, name, dose, frequency, source, reminderTimes:reminder_times, asNeeded:as_needed, createdAt:created_at, petId:pet_id'
    )
    .single();

  if (error) throw error;
  return data as unknown as MedicationRow;
};
