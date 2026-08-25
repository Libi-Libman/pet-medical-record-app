import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { db } from './db/db';
import { createPetsRepository } from './repositories/pets-repository';
import { createPetsService } from './services/pets-service';
import { createAppRouter } from './trpc/appRouter';

/* PETS */
const petsRepository = createPetsRepository(db);
const petsService = createPetsService(petsRepository);

const appRouter = createAppRouter({
  petsService,
});

Bun.serve({
  port: 3000,
  fetch(request) {
    // Only used for start-server-and-test package that
    // expects a 200 OK to start testing the server
    if (request.method === 'HEAD') {
      return new Response();
    }

    return fetchRequestHandler({
      endpoint: '/trpc',
      req: request,
      router: appRouter,
      createContext: ({ resHeaders }) => {
        resHeaders.set('Access-Control-Allow-Origin', '*');
        resHeaders.set('Access-Control-Request-Method', '*');
        resHeaders.set('Access-Control-Allow-Methods', 'OPTIONS, GET');
        resHeaders.set('Access-Control-Allow-Headers', '*');

        return { resHeaders };
      },
    });
  },
});
