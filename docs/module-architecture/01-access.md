# Module Architecture — Authentication & Organisation (`access`)

**Status:** Draft v1 · **Scope:** MVP
**Traces to:** [`../PRD.md`](../PRD.md) FR-1.1–1.3 · [`01-access PRD`](../module-PRDs/01-access.md)
**Depends on:** [`platform`](./00-platform.md)

Owns the HR user, the Organisation, signup/login use cases, and — with `platform` — the
tenant boundary every other module stands on.

---

## 1. Backend (Clean Architecture layers)

```
backend/src/access/
  domain/
    user.entity.ts             User (id, organisationId, email, name)
    organisation.entity.ts     Organisation (id, name)
    password.ts                PasswordHasher port (hash/verify)
    user.repository.ts         UserRepository port (findByEmail, create)
    organisation.repository.ts OrganisationRepository port
    access.errors.ts           EmailAlreadyRegisteredError, InvalidCredentialsError
  application/
    sign-up.usecase.ts         Creates org + owner user + seeds reference lists (tx)
    log-in.usecase.ts          Verifies credentials, issues JWT
    get-session.usecase.ts     Returns current user + organisation
    dto/                       SignUpCommand, LogInQuery, SessionView
  infrastructure/
    prisma-user.repository.ts
    prisma-organisation.repository.ts
    argon2-password.ts         PasswordHasher adapter (argon2)
    reference-seeder.ts        Seeds default departments/designations on org creation
  interface/
    auth.controller.ts         POST /auth/signup, /auth/login, GET /auth/me
    dto/                       SignUpDto, LogInDto, AuthResponseDto (class-validator)
  access.module.ts
```

**Key flows**

- **Sign up** (`SignUpUseCase`) runs in a `$transaction`: create `Organisation` → hash
  password (`argon2`) → create owner `User` → seed default `Department`/`Designation`
  reference lists so the create-employee form has dropdown values immediately → sign JWT.
- **Log in** (`LogInUseCase`): `findByEmail` → `argon2.verify` → on any mismatch throw a
  single `InvalidCredentialsError` (generic message; never reveals which field was wrong or
  whether the email exists).

JWT claims: `{ sub: userId, organisationId, email }`. The `organisationId` claim is what
`platform`'s `TenantGuard` reads for every subsequent request.

---

## 2. API contract

Base: `/api/v1` · Content-Type `application/json`. `/auth/signup` and `/auth/login` are
`@Public()`; `/auth/me` requires `Authorization: Bearer <jwt>`.

### `POST /auth/signup`
```jsonc
// request
{ "name": "Priya Rao", "email": "priya@acme.com", "password": "s3cret-pass", "organisationName": "ACME" }
// 201
{
  "accessToken": "eyJ…",
  "user": { "id": "usr_…", "name": "Priya Rao", "email": "priya@acme.com" },
  "organisation": { "id": "org_…", "name": "ACME" }
}
```
Errors: `400 VALIDATION_ERROR` (bad email / password < 8 chars / missing fields),
`409 CONFLICT` (email already registered).

### `POST /auth/login`
```jsonc
// request
{ "email": "priya@acme.com", "password": "s3cret-pass" }
// 200 — same AuthResponse shape as signup
```
Errors: `401 UNAUTHORIZED` — always the generic `"Email or password is incorrect."`

### `GET /auth/me`
```jsonc
// 200
{
  "user": { "id": "usr_…", "name": "Priya Rao", "email": "priya@acme.com" },
  "organisation": { "id": "org_…", "name": "ACME" }
}
```
Errors: `401 UNAUTHORIZED` (missing/expired token).

---

## 3. Frontend (`features/auth`)

```
frontend/src/features/auth/
  routes/
    LoginPage.tsx
    SignUpPage.tsx
  components/
    LoginForm.tsx        react-hook-form + zod (email, password)
    SignUpForm.tsx       react-hook-form + zod (name, email, password, orgName)
  api/
    useSignUp.ts         useMutation → POST /auth/signup
    useLogIn.ts          useMutation → POST /auth/login
    useSession.ts        useQuery → GET /auth/me
  AuthContext.tsx        Holds { user, organisation, token }; the one global store
  RequireAuth.tsx        Route guard: redirect to /login when unauthenticated
```

- **AuthContext** is the single genuinely-global piece of client state (per
  [`../architecture.md`](../architecture.md) Section 7). It holds the session and token;
  the token is attached to every generated-client request via an interceptor.
- On successful signup/login the mutation stores the token (in-memory + `localStorage` for
  refresh survival) and populates `AuthContext`, then routes to the dashboard.
- **RequireAuth** wraps all app routes; unauthenticated visitors are redirected to
  `/login` — there is no publicly readable data (US-3).
- Forms surface the API's field-level `details` (e.g. email-taken) inline; login shows only
  the single generic error to avoid account probing.

---

## 4. Traceability

| Requirement | Realised by |
| --- | --- |
| FR-1.1 email/password signup + login | `auth.controller` + `SignUp`/`LogIn` use cases + `argon2` |
| FR-1.2 first login creates owned Organisation | `SignUpUseCase` (org + owner in one tx) |
| FR-1.3 tenant isolation | JWT `organisationId` claim → `platform` `TenantGuard`/`TenantContext` |

Out of scope (per PRD): password reset, email verification, SSO, multiple users per org,
roles/permissions.
