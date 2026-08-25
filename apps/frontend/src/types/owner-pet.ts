import type { TRPCOutputs } from '@/lib/trpc';

export type OwnerPet = TRPCOutputs['pets']['getPetsByOwner'][number];
