import { createTRPCClient, httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';

import type { AppRouter, Outputs } from '@pet-med/backend/app-router';

const initTRPCClient = () =>
  createTRPCClient<AppRouter>({
    links: [
      /**
       * The function passed to enabled is an example in case you want to the link to
       * log to your console in development and only log errors in production
       */
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === 'development' ||
          (opts.direction === 'down' && opts.result instanceof Error),
      }),
      httpBatchLink({ url: 'http://localhost:3000/trpc' }),
    ],
  });

const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

export { initTRPCClient, TRPCProvider, useTRPC, useTRPCClient };

export type TRPCOutputs = Outputs;
