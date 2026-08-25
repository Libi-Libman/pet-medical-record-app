import { sql } from 'drizzle-orm';
import { boolean, date, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const pets = pgTable.withRLS('pets', {
  id: uuid()
    .default(sql`uuid_generate_v4()`)
    .primaryKey(),
  ownerId: uuid('owner_id').notNull(),
  name: text().notNull(),
  species: text().default('dog').notNull(),
  breed: text(),
  sex: text({ enum: ['male', 'female'] }).notNull(),
  sterilized: boolean().default(false).notNull(),
  birthDate: date('birth_date'),
  microchipNumber: text('microchip_number'),
  photoUrl: text('photo_url'),
  primaryContactId: uuid('primary_contact_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});
