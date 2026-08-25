import * as z from 'zod';

import type { PetsService } from '../../services/pets-service';
import { publicProcedure, router } from '../init';

export const createPetsRouter = (petsService: PetsService) => {
  return router({
    getPet: publicProcedure.input(z.uuid()).query(async ({ input }) => {
      const pet = await petsService.getPetById(input);
      return pet;
    }),

    getPetsByOwner: publicProcedure.input(z.uuid()).query(async ({ input }) => {
      const pets = await petsService.getPetsByOwnerId(input);
      return pets;
    }),
  });
};
