import type { PetMedDB } from '../db/db';
import type { PetSelectDAO } from '../db/schema-types';

export interface PetsRepository {
  getPetById(petId: string): Promise<PetSelectDAO | null>;
  getPetsByOwnerId(ownerId: string): Promise<PetSelectDAO[]>;
}

export const createPetsRepository = (db: PetMedDB): PetsRepository => {
  return {
    async getPetById(petId: string): Promise<PetSelectDAO | null> {
      const pet = await db.query.pets.findFirst({
        where: { id: petId },
      });
      return pet ?? null;
    },

    async getPetsByOwnerId(ownerId: string): Promise<PetSelectDAO[]> {
      const pets = await db.query.pets.findMany({
        where: { ownerId: ownerId },
      });
      return pets;
    },
  };
};
