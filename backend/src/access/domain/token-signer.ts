/** The claims Tankha signs into every access token (JWT payload). */
export interface AccessTokenClaims {
  sub: string;
  organisationId: string;
  email: string;
}

/**
 * Port for minting a signed access token. Implemented by a `@nestjs/jwt` adapter
 * in infrastructure; the login/signup use cases depend only on this abstraction
 * so they can be unit-tested with a deterministic fake signer.
 */
export abstract class TokenSigner {
  abstract sign(claims: AccessTokenClaims): string;
}
