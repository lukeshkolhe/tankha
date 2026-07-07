/**
 * A single parsed spreadsheet row, before any domain validation. Every cell is a
 * raw string exactly as the parser read it (the sheet references department and
 * designation BY NAME and country/currency BY ISO CODE; the five component
 * columns are amounts in MAJOR units). `rowNumber` is the 1-based line in the
 * source file (the header is row 1), so error and conflict reports point HR at
 * the exact row to fix.
 */
export interface EmployeeRow {
  rowNumber: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  country: string;
  currency: string;
  joinDate: string;
  basic: string;
  houseRentAllowance: string;
  specialAllowance: string;
  transportAllowance: string;
  annualBonus: string;
}
