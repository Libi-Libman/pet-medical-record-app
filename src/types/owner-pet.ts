import { TRPCOutputs } from '@pet-med/frontend';

export type OwnerPet = TRPCOutputs['pets']['getPetsByOwner'][number];
