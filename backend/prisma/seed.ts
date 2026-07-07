// Seeds the global static ISO reference tables (Country, Currency). Idempotent.
// Per-organisation reference data (Department/Designation) is seeded on signup by
// the access module; the 10k employee dataset (NFR-2) is loaded through the real
// import pipeline (data-exchange), not here.

import { PrismaClient } from '@prisma/client';
import { countries, currencies } from './reference-data';

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: { name: country.name },
      create: country,
    });
  }

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {
        name: currency.name,
        symbol: currency.symbol,
        minorUnitDigits: currency.minorUnitDigits,
      },
      create: currency,
    });
  }

  console.log(`Seeded ${countries.length} countries and ${currencies.length} currencies.`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
