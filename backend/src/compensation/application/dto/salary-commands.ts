import { SalaryComponentData, SalaryView, RevisionView } from '../../domain/read-models';

export { SalaryComponentData, SalaryView, RevisionView };

/**
 * Command to create an employee's first salary. Every field is explicit because
 * this use case is invoked cross-module (workforce create-employee, importer)
 * inside the caller's transaction — it does not read the request tenant context.
 */
export interface SetInitialSalaryInput {
  employeeId: string;
  organisationId: string;
  currencyCode: string;
  changedByUserId: string;
  components: SalaryComponentData[];
}

/**
 * Command to edit salary. The currency is NOT accepted here — it always follows
 * the existing structure. `changedByUserId` comes from the tenant context, not
 * the body.
 */
export interface EditSalaryInput {
  employeeId: string;
  remark: string;
  components: SalaryComponentData[];
}
