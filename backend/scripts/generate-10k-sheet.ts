// Generates a 10,000-row employee CSV in the exact import/sample-sheet format
// (see src/data-exchange/domain/sheet-parser.ts SHEET_COLUMNS), using the same
// department/designation names the access module seeds on signup and the
// countries/currencies seeded globally — so every row imports cleanly.
//
// Per NFR-2 / database-schema.md §6: scale is demonstrated by IMPORTING this
// sheet through the real pipeline, not by writing rows to the DB directly.
//
// Usage: npx ts-node scripts/generate-10k-sheet.ts [outputPath] [rowCount]

import { writeFileSync } from 'node:fs';
import { faker } from '@faker-js/faker';
import { DEFAULT_DEPARTMENTS, DEFAULT_DESIGNATIONS } from '../src/access/domain/reference-seeder';
import { countries, currencies } from '../prisma/reference-data';
import { SHEET_COLUMNS } from '../src/data-exchange/domain/sheet-parser';

const DEFAULT_ROW_COUNT = 10_000;

interface AnnualBand {
  basic: number;
  hra: number;
  special: number;
  transport: number;
  bonus: number;
}

function annualBandFor(currencyCode: string): AnnualBand {
  // Rough, currency-scaled annual bands (major units) so totals stay plausible
  // across a 3-order-of-magnitude spread (JPY/INR vs USD/EUR/GBP).
  const scale: Record<string, number> = {
    INR: 1_000_000,
    USD: 60_000,
    GBP: 45_000,
    EUR: 50_000,
    JPY: 6_000_000,
    SGD: 70_000,
    AED: 200_000,
    AUD: 80_000,
    CAD: 70_000,
  };
  const base = scale[currencyCode] ?? 50_000;
  const basic = faker.number.int({ min: Math.round(base * 0.5), max: Math.round(base * 0.9) });
  return {
    basic,
    hra: Math.round(basic * 0.4),
    special: Math.round(basic * 0.15),
    transport: Math.round(basic * 0.08),
    bonus: Math.round(basic * 0.1),
  };
}

function randomJoinDate(): string {
  const date = faker.date.between({ from: '2016-01-01', to: '2026-06-01' });
  return date.toISOString().slice(0, 10);
}

function buildRow(index: number): Record<string, string | number> {
  const currency = faker.helpers.arrayElement(currencies);
  const country = faker.helpers.arrayElement(countries);
  const band = annualBandFor(currency.code);
  return {
    employeeCode: `EMP-${String(index + 1).padStart(5, '0')}`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    department: faker.helpers.arrayElement(DEFAULT_DEPARTMENTS),
    designation: faker.helpers.arrayElement(DEFAULT_DESIGNATIONS),
    country: country.code,
    currency: currency.code,
    joinDate: randomJoinDate(),
    basic: band.basic,
    houseRentAllowance: band.hra,
    specialAllowance: band.special,
    transportAllowance: band.transport,
    annualBonus: band.bonus,
  };
}

function toCsv(rows: Array<Record<string, string | number>>): string {
  const header = SHEET_COLUMNS.join(',');
  const lines = rows.map((row) => SHEET_COLUMNS.map((column) => row[column]).join(','));
  return [header, ...lines].join('\n') + '\n';
}

function main(): void {
  const outputPath = process.argv[2] ?? 'seed-data/tankha-10k.csv';
  const rowCount = Number(process.argv[3] ?? DEFAULT_ROW_COUNT);

  const rows = Array.from({ length: rowCount }, (_, index) => buildRow(index));
  writeFileSync(outputPath, toCsv(rows));

  console.log(`Wrote ${rowCount} rows to ${outputPath}`);
}

main();
