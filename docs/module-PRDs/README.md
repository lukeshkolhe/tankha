# Tankha — Module PRDs

Product Requirements Documents for each MVP module, derived from and tracing back to
[`../PRD.md`](../PRD.md). Each answers *who* the user is, *what problem* we're
solving, *how we'll know it worked* (success metrics), and *what* we're building — as
user stories with acceptance criteria — before any implementation detail.

Read in dependency order:

| # | Module PRD | Covers (from PRD.md) | Depends on |
| --- | --- | --- | --- |
| 00 | [Platform & Product Qualities](./00-platform.md) | Non-functional (NFR-1…6), FR-1.3 | — |
| 01 | [Authentication & Organisation](./01-access.md) | FR-1.1–1.3 | 00 |
| 02 | [Employee Management](./02-workforce.md) | FR-2.1–2.4 | 00, 01, 03 |
| 03 | [Salary & Compensation](./03-compensation.md) | FR-3.1–3.3 | 00, 02 |
| 04 | [Data Import & Export](./04-data-exchange.md) | FR-4.1–4.3 | 02, 03 |
| 05 | [Dashboard & Analytics](./05-insights.md) | FR-5.1–5.3 | 02, 03 |

## Shape of each PRD

Every module PRD follows the same product-first structure:

1. **Problem & why it matters** — the pain (from [`../WHY-TANKHA.md`](../WHY-TANKHA.md))
   and why this module is worth building.
2. **Users & jobs-to-be-done** — the HR Manager and the jobs they're hiring Tankha for.
3. **Goals & success metrics** — measurable outcomes that define success.
4. **User stories & acceptance criteria** — prioritised (P0/P1), testable.
5. **Functional requirements** — traced to the FR IDs in `../PRD.md`.
6. **Key user flows / UX** — the experience, not the schema.
7. **Out of scope (MVP)** — explicit non-goals.
8. **Dependencies & assumptions.**
9. **Risks & open questions.**

## What's deliberately *not* here

These PRDs stay at the product level. Concrete technical design — data models, API
contracts, framework choices, validation mechanics, test plans — is a **separate
architecture / tech-design concern** (see [`../architecture.md`](../architecture.md)).
Whether each module also needs its own detailed tech-design doc is still to be decided.
