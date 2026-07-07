import { Injectable } from '@nestjs/common';
import { FieldError, NotFoundError, TenantContext, UnitOfWork } from 'src/platform';
import { SetInitialSalaryUseCase } from 'src/compensation/application/set-initial-salary.usecase';
import { EmployeeRepository } from '../domain/employee.repository';
import { ReferenceRepository } from '../domain/reference.repository';
import { Employee, EmployeeAttributes } from '../domain/employee.entity';
import { EmployeeValidation, EmployeeValidationInput } from '../domain/employee-validation';
import { raiseEmployeeValidation } from '../domain/workforce.errors';
import { CreateEmployeeCommand, EmployeeView } from './dto/employee-commands';

/**
 * Creates an employee and its initial salary atomically. Validation (shared with
 * the importer) runs first; then a single `UnitOfWork.run` writes the Employee
 * row and delegates the salary to `compensation`'s SetInitialSalary. Both write
 * through `prisma.activeClient`, so they share one transaction (NFR-4). This is
 * the only cross-module edge and it is one-directional.
 */
@Injectable()
export class CreateEmployeeUseCase {
  constructor(
    private readonly employees: EmployeeRepository,
    private readonly references: ReferenceRepository,
    private readonly setInitialSalary: SetInitialSalaryUseCase,
    private readonly unitOfWork: UnitOfWork,
    private readonly tenant: TenantContext,
  ) {}

  async execute(command: CreateEmployeeCommand): Promise<EmployeeView> {
    const errors = await this.validate(command);
    if (errors.length > 0) {
      raiseEmployeeValidation(command.employeeCode, errors);
    }
    const employeeId = await this.unitOfWork.run(() => this.persist(command));
    return this.load(employeeId);
  }

  private async validate(command: CreateEmployeeCommand): Promise<FieldError[]> {
    const references = await this.references.loadValidReferences();
    const codeExists = await this.employees.existsByCode(command.employeeCode);
    return EmployeeValidation.validate(toValidationInput(command), references, codeExists);
  }

  private async persist(command: CreateEmployeeCommand): Promise<string> {
    const employeeId = await this.employees.create(Employee.create(toAttributes(command)));
    await this.setInitialSalary.execute({
      employeeId,
      organisationId: this.tenant.organisationId,
      currencyCode: command.currencyCode,
      changedByUserId: this.tenant.userId,
      components: command.salary.components,
    });
    return employeeId;
  }

  private async load(employeeId: string): Promise<EmployeeView> {
    const view = await this.employees.findById(employeeId);
    if (!view) {
      throw new NotFoundError(`Employee ${employeeId} not found after creation.`);
    }
    return view;
  }
}

function toAttributes(command: CreateEmployeeCommand): EmployeeAttributes {
  return {
    employeeCode: command.employeeCode,
    firstName: command.firstName,
    lastName: command.lastName,
    departmentId: command.departmentId,
    designationId: command.designationId,
    countryCode: command.countryCode,
    currencyCode: command.currencyCode,
    joinDate: command.joinDate,
  };
}

function toValidationInput(command: CreateEmployeeCommand): EmployeeValidationInput {
  return { ...toAttributes(command), salaryComponents: command.salary.components };
}
