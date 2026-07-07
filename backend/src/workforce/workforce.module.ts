import { Module } from '@nestjs/common';
import { CompensationModule } from 'src/compensation/compensation.module';
import { EmployeeRepository } from './domain/employee.repository';
import { ReferenceRepository } from './domain/reference.repository';
import { EmployeeValidation } from './domain/employee-validation';
import { PrismaEmployeeRepository } from './infrastructure/prisma-employee.repository';
import { PrismaReferenceRepository } from './infrastructure/prisma-reference.repository';
import { CreateEmployeeUseCase } from './application/create-employee.usecase';
import { UpdateEmployeeUseCase } from './application/update-employee.usecase';
import { DeactivateEmployeeUseCase } from './application/deactivate-employee.usecase';
import { ListEmployeesUseCase } from './application/list-employees.usecase';
import { GetEmployeeUseCase } from './application/get-employee.usecase';
import { EmployeesController } from './interface/employees.controller';
import { ReferenceController } from './interface/reference.controller';

/**
 * The `workforce` bounded context: the Employee aggregate, its validation rules
 * (reused by the importer), the reference lists and the paged list. Imports
 * `CompensationModule` to delegate initial salary creation on the single,
 * one-directional cross-module edge — no forwardRef, no cycle. Exports the two
 * repository ports and `EmployeeValidation` so the importer can reuse them.
 */
@Module({
  imports: [CompensationModule],
  controllers: [EmployeesController, ReferenceController],
  providers: [
    { provide: EmployeeRepository, useClass: PrismaEmployeeRepository },
    { provide: ReferenceRepository, useClass: PrismaReferenceRepository },
    { provide: EmployeeValidation, useValue: EmployeeValidation },
    CreateEmployeeUseCase,
    UpdateEmployeeUseCase,
    DeactivateEmployeeUseCase,
    ListEmployeesUseCase,
    GetEmployeeUseCase,
  ],
  exports: [EmployeeRepository, ReferenceRepository, EmployeeValidation],
})
export class WorkforceModule {}
