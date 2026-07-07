import { Injectable } from '@nestjs/common';
import { FieldError, NotFoundError, UnitOfWork } from 'src/platform';
import { EmployeeRepository } from '../domain/employee.repository';
import { ReferenceRepository } from '../domain/reference.repository';
import { Employee, EmployeeAttributes } from '../domain/employee.entity';
import { EmployeeValidation, EmployeeValidationInput } from '../domain/employee-validation';
import { raiseEmployeeValidation } from '../domain/workforce.errors';
import { EmployeeView, UpdateEmployeeCommand } from './dto/employee-commands';

/**
 * Edits an employee's core attributes only — salary is never touched here (it
 * flows through `compensation`). Any subset of attributes may be supplied; the
 * merged result is re-validated with the shared rule set, and a code collision is
 * only checked when the code actually changes.
 */
@Injectable()
export class UpdateEmployeeUseCase {
  constructor(
    private readonly employees: EmployeeRepository,
    private readonly references: ReferenceRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(id: string, command: UpdateEmployeeCommand): Promise<EmployeeView> {
    const existing = await this.employees.findEntityById(id);
    if (!existing) {
      throw new NotFoundError(`Employee ${id} not found.`);
    }
    const updated = existing.withAttributes(merge(existing, command));
    const errors = await this.validate(existing, updated);
    if (errors.length > 0) {
      raiseEmployeeValidation(updated.employeeCode, errors);
    }
    await this.unitOfWork.run(() => this.employees.update(updated));
    return this.load(id);
  }

  private async validate(existing: Employee, updated: Employee): Promise<FieldError[]> {
    const references = await this.references.loadValidReferences();
    const codeExists = await this.codeTaken(existing, updated);
    return EmployeeValidation.validate(toValidationInput(updated), references, codeExists);
  }

  private codeTaken(existing: Employee, updated: Employee): Promise<boolean> {
    if (existing.employeeCode === updated.employeeCode) {
      return Promise.resolve(false);
    }
    return this.employees.existsByCode(updated.employeeCode);
  }

  private async load(id: string): Promise<EmployeeView> {
    const view = await this.employees.findById(id);
    if (!view) {
      throw new NotFoundError(`Employee ${id} not found.`);
    }
    return view;
  }
}

function merge(existing: Employee, command: UpdateEmployeeCommand): EmployeeAttributes {
  return {
    employeeCode: command.employeeCode ?? existing.employeeCode,
    firstName: command.firstName ?? existing.firstName,
    lastName: command.lastName ?? existing.lastName,
    departmentId: command.departmentId ?? existing.departmentId,
    designationId: command.designationId ?? existing.designationId,
    countryCode: command.countryCode ?? existing.countryCode,
    currencyCode: command.currencyCode ?? existing.currencyCode,
    joinDate: command.joinDate ?? existing.joinDate,
  };
}

function toValidationInput(employee: Employee): EmployeeValidationInput {
  return {
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    departmentId: employee.departmentId,
    designationId: employee.designationId,
    countryCode: employee.countryCode,
    currencyCode: employee.currencyCode,
    joinDate: employee.joinDate,
  };
}
