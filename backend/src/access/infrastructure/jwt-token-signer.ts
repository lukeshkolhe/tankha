import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenClaims, TokenSigner } from '../domain/token-signer';

/**
 * `@nestjs/jwt` adapter for the TokenSigner port. Signs the { sub, organisationId,
 * email } claims with the secret and expiry configured on the global JwtModule;
 * the same secret is what platform's JwtStrategy verifies on every later request.
 */
@Injectable()
export class JwtTokenSigner extends TokenSigner {
  constructor(private readonly jwt: JwtService) {
    super();
  }

  sign(claims: AccessTokenClaims): string {
    return this.jwt.sign(claims);
  }
}
