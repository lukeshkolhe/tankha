import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';

/**
 * Edit payload: every core attribute of the create DTO, all optional, with the
 * `salary` field removed — salary changes go through `compensation`, never here.
 */
export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['salary'] as const),
) {}
