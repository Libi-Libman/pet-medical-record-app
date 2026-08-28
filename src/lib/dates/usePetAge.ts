import { differenceInYears } from 'date-fns';
import { OwnerPet } from '../../types/owner-pet';

export const usePetAge = (pet: OwnerPet) => {
  if (!pet.birthDate) return;
  const age = differenceInYears(Date.now(), new Date(pet.birthDate));
  return new Intl.NumberFormat('en', { style: 'unit', unit: 'year', unitDisplay: 'long' }).format(
    age
  );
};
