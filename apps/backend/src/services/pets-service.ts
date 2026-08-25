import type { PetSelectDAO } from '../db/schema-types';
import type { PetsRepository } from '../repositories/pets-repository';

export interface PetsService {
  getPetById(petId: string): Promise<PetDTO | null>;
  getPetsByOwnerId(ownerId: string): Promise<PetDTO[]>;
}

export const createPetsService = (repository: PetsRepository): PetsService => {
  return {
    getPetById: async (petId: string): Promise<PetDTO | null> => {
      const pet = await repository.getPetById(petId);
      return pet;
    },

    getPetsByOwnerId: async (ownerId: string): Promise<PetDTO[]> => {
      const pets = await repository.getPetsByOwnerId(ownerId);
      return pets;
    },
  };
};

export type PetDTO = PetSelectDAO;
