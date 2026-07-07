import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route out of the global JwtAuthGuard. Only `/auth/signup` and
 * `/auth/login` are @Public(); everything else requires a bearer token.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
