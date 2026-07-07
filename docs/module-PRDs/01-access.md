# Module PRD — Authentication & Organisation (`access`)

**Status:** Draft v1 · **Owner:** Product · **Scope:** MVP
**Traces to:** [`../PRD.md`](../PRD.md) — FR-1.1, FR-1.2, FR-1.3
**Depends on:** [Platform](./00-platform.md)

---

## 1. Problem & why it matters

Today ACME's salary data lives in a spreadsheet file. Whoever has the file has
everyone's pay — there is no front door, no way to say "this data belongs to this
organisation, and only its HR team may see it." Splitting the file per department just
creates more copies that drift apart.

For Tankha to be trustworthy as the *single source of truth*, every piece of data must
sit behind a login and belong to exactly one organisation. Nothing else in the product
can be trusted until this boundary exists — so this is the first thing an HR Manager
touches, and the foundation every other module stands on.

## 2. Users & jobs-to-be-done

**Primary user:** HR Manager (the only persona in the MVP).

- *"When I first arrive, I want to set up my organisation and get in, so I can start
  moving my salary data out of Excel."*
- *"When I come back, I want to log in quickly and be confident that only my team can
  see our pay data."*

## 3. Goals & success metrics

**Goal:** Give HR a private, single-tenant home for their salary data that takes under
a minute to set up.

| Metric | Target | Why it matters |
| --- | --- | --- |
| Time to complete signup → land in the app | < 60 seconds | First impression; low friction to adopt |
| Signup completion rate (started → org created) | ≥ 90% | Onboarding isn't a drop-off point |
| Cross-tenant data leaks | **0** | The core trust promise of the product |

## 4. User stories & acceptance criteria

**US-1 — Sign up and create my organisation (P0)**
> As an HR Manager, I want to sign up with my email and password and name my
> organisation, so that I have a private workspace for our salary data.

- [ ] I can register with name, email, password, and organisation name.
- [ ] On success I am logged in and my organisation exists, owned by my account.
- [ ] If the email is already registered, I get a clear, non-technical message.
- [ ] Weak or malformed inputs (bad email, short password) are rejected with guidance.

**US-2 — Log in (P0)**
> As an HR Manager, I want to log back in, so that I can return to my data securely.

- [ ] Correct email + password logs me in.
- [ ] Wrong credentials show a single generic "email or password is incorrect" message
      (no hint about which was wrong, and no way to probe who has an account).

**US-3 — Stay inside my own organisation (P0)**
> As an HR Manager, I want to only ever see my organisation's data, so that our pay
> information is never exposed to anyone else.

- [ ] Every screen and every piece of data I access is scoped to my organisation.
- [ ] There is no route, filter, or export through which another org's data appears.

## 5. Functional requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1.1 | Sign up and log in with email + password | P0 |
| FR-1.2 | First login creates an Organisation, owned by the HR account | P0 |
| FR-1.3 | All data scoped to the organisation (tenant isolation) | P0 |

## 6. Key user flow

```
Landing → Sign up (name, email, password, org name) → Org created → Dashboard
                    ↘ Returning user → Log in → Dashboard
```

Unauthenticated visitors are always redirected to login; there is no publicly
readable data.

## 7. Out of scope (MVP)

Password reset & email verification, SSO / social login, multiple users per
organisation, roles & permissions, and any employee self-service login. (See
[`../PRD.md`](../PRD.md) out-of-scope list.) One HR user per org is sufficient for the MVP, so a
permission matrix adds cost without value yet.

## 8. Dependencies & assumptions

- Assumes one HR Manager per organisation.
- All other modules assume the `organisation` boundary this module establishes.

## 9. Risks & open questions

- **Account recovery:** with no password reset in MVP, a locked-out HR Manager has no
  self-serve path back in. Acceptable for a demo; revisit before real customers.
- **Open question:** do we need a lightweight "invite a colleague" story soon after
  MVP, or is single-user genuinely enough for the first customers?
