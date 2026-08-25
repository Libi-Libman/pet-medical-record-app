import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { OwnerPet } from '../../types/owner-pet';

const HARDCODED_OWNER_ID = '9ec8cd93-79c6-4cbd-ba3e-b2eb139f79ff';

export const useOwnerPets = () => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.pets.getPetsByOwner.queryOptions(HARDCODED_OWNER_ID),
    select: (data) => data as OwnerPet[],
  });
};
