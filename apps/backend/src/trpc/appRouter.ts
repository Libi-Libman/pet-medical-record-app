import type { inferRouterOutputs } from '@trpc/server';
import type { PetsService } from '../services/pets-service';
import { router } from './init';

type AppServices = {
  petsService: PetsService;
};

export const createAppRouter = (services: AppServices) => {
  return router({
    pets: createPetsRouter(services.petsService),
  });
};

import { createPetsRouter } from './routers/pets-router';

export type AppRouter = ReturnType<typeof createAppRouter>;

export type Outputs = inferRouterOutputs<AppRouter>;
