import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { relations } from '../../src/db/relations.ts';
import * as schema from '../../src/db/schema.ts';

const db = drizzle(process.env.DATABASE_URL!, { relations });

const HARDCODED_OWNER_ID = '9ec8cd93-79c6-4cbd-ba3e-b2eb139f79ff';

const pets: (typeof schema.pets.$inferInsert)[] = [];

for (let i = 0; i < 5; i++) {
  const species = faker.helpers.arrayElement(['dog', 'cat']);
  const breed = species === 'cat' ? faker.animal.cat() : faker.animal.dog();
  pets.push({
    ownerId: HARDCODED_OWNER_ID,
    name: faker.animal.petName(),
    sex: faker.helpers.arrayElement(['female', 'male']),
    birthDate: faker.date.birthdate({ mode: 'age', min: 1, max: 13 }).toISOString(),
    species,
    breed,
  });
}

console.log('Resetting Database...');

const tablesToTruncate = Object.entries(schema).map(([_, table]) => {
  const config = getTableConfig(table);
  config.schema = config.schema === undefined ? 'public' : config.schema;

  return `"${config.schema}"."${config.name}"`;
});

await db.execute(sql.raw(`truncate ${tablesToTruncate.join(',')} cascade;`));

console.log('Reset successful.');

console.log('Seeding pets...');
await db.insert(schema.pets).values(pets);
console.log('Seeding pets done.');
