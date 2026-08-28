import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { OwnerPet } from '../../types/owner-pet';

// No owner id passed in — RLS on the `pets` table restricts every query to
// `auth.uid() = owner_id` automatically (see supabase/rls-policies.sql).
export const useOwnerPets = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['pets', 'owner', session?.user.id],
    enabled: !!session,
    queryFn: async (): Promise<OwnerPet[]> => {
      const { data, error } = await supabase
        .from('pets')
        .select(
          'id, name, species, breed, sex, sterilized, birthDate:birth_date, microchipNumber:microchip_number, photoUrl:photo_url, primaryContactId:primary_contact_id'
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as OwnerPet[];
    },
  });
};
