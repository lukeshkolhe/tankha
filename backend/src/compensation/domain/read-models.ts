import { SalaryComponentType } from '@prisma/client';

/** A component line as it crosses the API / persistence boundary. */
export interface SalaryComponentData {
  type: SalaryComponentType;
  amountMinor: number;
}

/** The current-pay read model returned by `GET /employees/:id/salary`. */
export interface SalaryView {
  employeeId: string;
  currency: string;
  components: SalaryComponentData[];
  totalMinor: number;
}

/** The user attributed to a revision. */
export interface ChangedBy {
  id: string;
  name: string;
}

/** One entry in the salary-change timeline. */
export interface RevisionView {
  id: string;
  oldTotalMinor: number | null;
  newTotalMinor: number;
  currency: string;
  remark: string;
  changedBy: ChangedBy;
  createdAt: string;
  componentsSnapshot: SalaryComponentData[];
}
