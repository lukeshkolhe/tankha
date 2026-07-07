import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReferenceRepository } from '../domain/reference.repository';

/**
 * Reference lists that feed the create/edit dropdowns and the importer's
 * validation. Departments/designations are tenant-scoped; countries/currencies
 * are global ISO lists. Read-only.
 */
@ApiTags('workforce')
@ApiBearerAuth()
@Controller('reference')
export class ReferenceController {
  constructor(private readonly references: ReferenceRepository) {}

  @Get('departments')
  @ApiOperation({ summary: 'Departments in this organisation' })
  departments() {
    return this.references.listDepartments();
  }

  @Get('designations')
  @ApiOperation({ summary: 'Designations in this organisation' })
  designations() {
    return this.references.listDesignations();
  }

  @Get('countries')
  @ApiOperation({ summary: 'Global ISO countries' })
  countries() {
    return this.references.listCountries();
  }

  @Get('currencies')
  @ApiOperation({ summary: 'Global ISO currencies' })
  currencies() {
    return this.references.listCurrencies();
  }
}
