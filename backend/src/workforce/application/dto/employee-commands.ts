import { SalaryComponentInput } from '../../domain/employee-validation';
import {
  EmployeeRowView,
  EmployeeView,
  NamedReference,
  SalarySummaryView,
} from '../../domain/read-models';

export {
  EmployeeRowView,
  EmployeeView,
  NamedReference,
  SalarySummaryView,
  SalaryComponentInput,
};

/** The initial salary payload delegated to `compensation` on create. */
export interface SalaryInput {
  components: SalaryComponentInput[];
}

/**
 * Command to create an employee together with its initial salary. The salary is
 * handed to `compensation`'s SetInitialSalary inside one transaction;
 * `organisationId`/`changedByUserId` are never in the command — they come from
 * the tenant context.
 */
export interface CreateEmployeeCommand {
  employeeCode: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  designationId: string;
  countryCode: string;
  currencyCode: string;
  joinDate: string;
  salary: SalaryInput;
}

/** Command to edit core attributes only — any subset; never salary. */
export interface UpdateEmployeeCommand {
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  departmentId?: string;
  designationId?: string;
  countryCode?: string;
  currencyCode?: string;
  joinDate?: string;
}

/** The raw list inputs before normalisation into an `EmployeeListQuery`. */
export interface ListEmployeesQuery {
  page?: number | string;
  pageSize?: number | string;
  sort?: string;
  search?: string;
  department?: string;
  designation?: string;
  country?: string;
  status?: string;
}
