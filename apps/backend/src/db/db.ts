import { drizzle } from 'drizzle-orm/postgres-js';

import { relations } from './relations';

export const db = drizzle(process.env.DATABASE_URL ?? '', { relations, logger: true });

export type PetMedDB = typeof db;
