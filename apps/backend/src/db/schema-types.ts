import { pets as petsTable } from './schema';

export type PetSelectDAO = typeof petsTable.$inferSelect;