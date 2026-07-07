import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateEmployeeUseCase } from '../application/create-employee.usecase';
import { UpdateEmployeeUseCase } from '../application/update-employee.usecase';
import { DeactivateEmployeeUseCase } from '../application/deactivate-employee.usecase';
import { ListEmployeesUseCase } from '../application/list-employees.usecase';
import { GetEmployeeUseCase } from '../application/get-employee.usecase';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';

/**
 * Employee CRUD + soft lifecycle. All routes require auth and are tenant-scoped
 * (the org is taken from the JWT, never the request body). Create delegates the
 * initial salary to `compensation` inside one transaction.
 */
@ApiTags('workforce')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly createEmployee: CreateEmployeeUseCase,
    private readonly updateEmployee: UpdateEmployeeUseCase,
    private readonly deactivateEmployee: DeactivateEmployeeUseCase,
    private readonly listEmployees: ListEmployeesUseCase,
    private readonly getEmployee: GetEmployeeUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List employees — paged/filtered/searched (FR-2.4)' })
  list(@Query() query: ListEmployeesQueryDto) {
    return this.listEmployees.execute(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create an employee + initial salary in one tx (FR-2.1, FR-2.3)' })
  create(@Body() body: CreateEmployeeDto) {
    return this.createEmployee.execute(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Employee detail incl. current salary summary' })
  detail(@Param('id') id: string) {
    return this.getEmployee.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit core attributes — never salary (FR-2.1)' })
  update(@Param('id') id: string, @Body() body: UpdateEmployeeDto) {
    return this.updateEmployee.execute(id, body);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Soft deactivate — status INACTIVE, history preserved (FR-2.1)' })
  deactivate(@Param('id') id: string) {
    return this.deactivateEmployee.deactivate(id);
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Restore status ACTIVE' })
  reactivate(@Param('id') id: string) {
    return this.deactivateEmployee.reactivate(id);
  }
}
