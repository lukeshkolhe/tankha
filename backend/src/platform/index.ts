/**
 * Public surface of the platform module. Feature modules import shared
 * primitives from here (`src/platform`) rather than reaching into subpaths.
 */
export { PlatformModule } from './platform.module';

// Errors
export {
  DomainError,
  ValidationError,
  UnauthorizedError,
  TenantForbiddenError,
  NotFoundError,
  DuplicateError,
  CurrencyMismatchError,
} from './errors/domain-error';
export type { FieldError } from './errors/domain-error';

// Money
export { Money } from './http/money';

// Pagination
export { PageRequest, PaginatedResult } from './http/pagination';
export type { RawPageParams } from './http/pagination';

// Persistence
export { PrismaService } from './prisma/prisma.service';
export { UnitOfWork } from './prisma/unit-of-work';

// Tenancy & auth
export { TenantContext } from './tenancy/tenant-context';
export type { AuthenticatedPrincipal } from './tenancy/tenant-context';
export { Public } from './auth/public.decorator';
export { CurrentUser } from './auth/current-user.decorator';
export { AppConfig } from './config/app-config';
