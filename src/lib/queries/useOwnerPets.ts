import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { OwnerPet } from '../../types/owner-pet';

const SELECT_COLUMNS =
  'id, name, species, breed, sex, sterilized, birthDate:birth_date, microchipNumber:microchip_number, photoUrl:photo_url, primaryContactId:primary_contact_id';

// No owner id passed in — RLS on the `pets` table restricts every query to
// `auth.uid() = owner_id` automatically (see supabase/rls-policies.sql).
// Disabled under the dev-only mock session — there's no real Supabase JWT
// to query with, so it would just come back empty via RLS anyway.
export const useOwnerPets = () => {
  const { session, isMockSession } = useAuth();

  return useQuery({
    queryKey: ['pets', 'owner', session?.user.id],
    enabled: !!session && !isMockSession,
    queryFn: async (): Promise<OwnerPet[]> => {
      const { data, error } = await supabase
        .from('pets')
        .select(SELECT_COLUMNS)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as OwnerPet[];
    },
  });
};

export const insertPet = async (input: {
  name: string;
  species: string;
  breed: string | null;
  sex: 'male' | 'female' | null;
  sterilized: boolean;
  birthDate: string | null;
  microchipNumber: string | null;
}): Promise<OwnerPet> => {
  const { data, error } = await supabase
    .from('pets')
    .insert({
      name: input.name,
      species: input.species,
      breed: input.breed,
      sex: input.sex,
      sterilized: input.sterilized,
      birth_date: input.birthDate,
      microchip_number: input.microchipNumber,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return data as unknown as OwnerPet;
};
