import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedPrincipal } from '../tenancy/tenant-context';

/**
 * Injects the authenticated principal into a controller handler:
 * `@CurrentUser() principal: AuthenticatedPrincipal`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
