import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PageRequest, RawPageParams } from 'src/platform';
import { GetSalaryUseCase } from '../application/get-salary.usecase';
import { EditSalaryUseCase } from '../application/edit-salary.usecase';
import { ListRevisionsUseCase } from '../application/list-revisions.usecase';
import { EditSalaryDto } from './dto/edit-salary.dto';
import { SalaryViewDto } from './dto/salary-view.dto';
import { RevisionPageDto } from './dto/revision-view.dto';

/**
 * Salary endpoints nested under an employee. All require auth and are
 * tenant-scoped. Currency is never accepted — it follows the employee; the total
 * is always computed server-side.
 */
@ApiTags('compensation')
@ApiBearerAuth()
@Controller('employees/:employeeId/salary')
export class SalaryController {
  constructor(
    private readonly getSalary: GetSalaryUseCase,
    private readonly editSalary: EditSalaryUseCase,
    private readonly listRevisions: ListRevisionsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Current pay — components + computed total (FR-3.1)' })
  @ApiOkResponse({ type: SalaryViewDto })
  current(@Param('employeeId') employeeId: string): Promise<SalaryViewDto> {
    return this.getSalary.execute(employeeId);
  }

  @Put()
  @ApiOperation({ summary: 'Edit salary with a required remark (FR-3.2, FR-3.3)' })
  @ApiOkResponse({ type: SalaryViewDto })
  edit(@Param('employeeId') employeeId: string, @Body() body: EditSalaryDto): Promise<SalaryViewDto> {
    return this.editSalary.execute({
      employeeId,
      remark: body.remark,
      components: body.components,
    });
  }

  @Get('revisions')
  @ApiOperation({ summary: 'Salary-change history, newest first (FR-3.3)' })
  @ApiOkResponse({ type: RevisionPageDto })
  revisions(@Param('employeeId') employeeId: string, @Query() query: RawPageParams): Promise<RevisionPageDto> {
    return this.listRevisions.execute(employeeId, PageRequest.from(query));
  }
}
