import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

export type AllergyRow = {
  id: string;
  petId: string;
  substance: string;
  reaction: string | null;
  severity: string | null;
  dateIdentified: string | null;
};

const SELECT_COLUMNS =
  'id, petId:pet_id, substance, reaction, severity, dateIdentified:date_identified';

export const useAllergies = (petId: string | undefined) => {
  const { session, isMockSession } = useAuth();
  return useQuery({
    queryKey: ['allergies', 'pet', petId],
    enabled: !!session && !isMockSession && !!petId,
    queryFn: async (): Promise<AllergyRow[]> => {
      const { data, error } = await supabase
        .from('allergies')
        .select(SELECT_COLUMNS)
        .eq('pet_id', petId)
        .order('date_identified', { ascending: false });
      if (error) throw error;
      return data as unknown as AllergyRow[];
    },
  });
};

export const insertAllergy = async (input: {
  petId: string;
  substance: string;
  reaction: string | null;
  severity: string | null;
  dateIdentified: string | null;
}): Promise<AllergyRow> => {
  const { data, error } = await supabase
    .from('allergies')
    .insert({
      pet_id: input.petId,
      substance: input.substance,
      reaction: input.reaction,
      severity: input.severity,
      date_identified: input.dateIdentified,
    })
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;
  return data as unknown as AllergyRow;
};
