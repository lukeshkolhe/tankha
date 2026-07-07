/**
 * The tenant every user and employee belongs to. An MVP Organisation is just its
 * identity and name; the `organisationId` claim minted from `id` at signup is
 * what platform's TenantGuard scopes every later request by.
 */
export class Organisation {
  private constructor(
    readonly id: string,
    readonly name: string,
  ) {}

  static of(id: string, name: string): Organisation {
    return new Organisation(id, name);
  }
}
