import { AccessTokenClaims, TokenSigner } from '../../domain/token-signer';

/**
 * Deterministic TokenSigner for unit tests: encodes the claims into a readable
 * string so tests can assert the token carries the expected sub/organisationId
 * without a real JWT secret.
 */
export class FakeTokenSigner extends TokenSigner {
  sign(claims: AccessTokenClaims): string {
    return `token(${claims.sub}:${claims.organisationId}:${claims.email})`;
  }
}
