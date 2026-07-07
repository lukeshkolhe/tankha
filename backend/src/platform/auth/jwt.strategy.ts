import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '../config/app-config';
import { AuthenticatedPrincipal } from '../tenancy/tenant-context';

/** The claims Tankha signs into every access token. */
export interface JwtClaims {
  sub: string;
  organisationId: string;
  email: string;
}

/**
 * Verifies the bearer token and projects its claims into the
 * AuthenticatedPrincipal that Nest attaches to `req.user` — the sole source of
 * `organisationId` for tenant scoping.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: AppConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
    });
  }

  validate(claims: JwtClaims): AuthenticatedPrincipal {
    return { userId: claims.sub, organisationId: claims.organisationId, email: claims.email };
  }
}
