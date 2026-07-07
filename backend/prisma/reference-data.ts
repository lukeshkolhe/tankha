// Global static ISO reference data. These tables are owned by no feature module
// (Country/Currency are global, per database-schema.md) and are upserted by the
// seed script. minorUnitDigits drives major<->minor conversion on import/display.

export const countries: Array<{ code: string; name: string }> = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
];

export const currencies: Array<{
  code: string;
  name: string;
  symbol: string;
  minorUnitDigits: number;
}> = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', minorUnitDigits: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', minorUnitDigits: 2 },
  { code: 'GBP', name: 'Pound Sterling', symbol: '£', minorUnitDigits: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', minorUnitDigits: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', minorUnitDigits: 0 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', minorUnitDigits: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', minorUnitDigits: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', minorUnitDigits: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', minorUnitDigits: 2 },
];
