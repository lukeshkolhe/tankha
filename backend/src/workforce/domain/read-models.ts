import { EmployeeStatus } from '@prisma/client';
import { SalaryComponentInput } from './employee-validation';

/** A named reference as it appears in an employee detail view. */
export interface NamedReference {
  id: string;
  name: string;
}

/** The current-pay summary embedded in the detail view (read-only join). */
export interface SalarySummaryView {
  currency: string;
  components: SalaryComponentInput[];
  totalMinor: number;
}

/**
 * One row of the employee list. Includes the current `salaryTotalMinor` + its
 * currency, read directly from the `SalaryStructure` projection so the list
 * shows pay at a glance without an N+1.
 */
export interface EmployeeRowView {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  country: string;
  currency: string;
  status: EmployeeStatus;
  joinDate: string;
  salaryTotalMinor: number | null;
}

/** Full employee detail: attributes + current salary structure summary. */
export interface EmployeeView {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: NamedReference;
  designation: NamedReference;
  countryCode: string;
  currencyCode: string;
  status: EmployeeStatus;
  joinDate: string;
  salary: SalarySummaryView | null;
}
