import { EmployeeStatus } from '@prisma/client';
import { EmployeeCode } from './employee-code.vo';

/** The core, salary-free attributes that define an employee record. */
export interface EmployeeAttributes {
  employeeCode: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  designationId: string;
  countryCode: string;
  currencyCode: string;
  joinDate: string;
}

/**
 * The employee aggregate: identity, core attributes and lifecycle status.
 * Salary lives in the `compensation` context, never here. Constructed only via
 * the factories, so `employeeCode` is always a validated value object and a new
 * record always starts `ACTIVE`. Deactivate/reactivate return a new instance —
 * the entity is treated as immutable.
 */
export class Employee {
  private constructor(
    readonly id: string | null,
    readonly code: EmployeeCode,
    readonly firstName: string,
    readonly lastName: string,
    readonly departmentId: string,
    readonly designationId: string,
    readonly countryCode: string,
    readonly currencyCode: string,
    readonly joinDate: string,
    readonly status: EmployeeStatus,
  ) {}

  static create(attributes: EmployeeAttributes): Employee {
    return Employee.build(null, attributes, EmployeeStatus.ACTIVE);
  }

  static reconstitute(id: string, attributes: EmployeeAttributes, status: EmployeeStatus): Employee {
    return Employee.build(id, attributes, status);
  }

  withAttributes(attributes: EmployeeAttributes): Employee {
    return Employee.build(this.id, attributes, this.status);
  }

  deactivate(): Employee {
    return this.withStatus(EmployeeStatus.INACTIVE);
  }

  reactivate(): Employee {
    return this.withStatus(EmployeeStatus.ACTIVE);
  }

  get employeeCode(): string {
    return this.code.value;
  }

  private withStatus(status: EmployeeStatus): Employee {
    return new Employee(
      this.id,
      this.code,
      this.firstName,
      this.lastName,
      this.departmentId,
      this.designationId,
      this.countryCode,
      this.currencyCode,
      this.joinDate,
      status,
    );
  }

  private static build(
    id: string | null,
    attributes: EmployeeAttributes,
    status: EmployeeStatus,
  ): Employee {
    return new Employee(
      id,
      EmployeeCode.of(attributes.employeeCode),
      attributes.firstName,
      attributes.lastName,
      attributes.departmentId,
      attributes.designationId,
      attributes.countryCode,
      attributes.currencyCode,
      attributes.joinDate,
      status,
    );
  }
}
