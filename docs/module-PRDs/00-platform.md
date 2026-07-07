# Module PRD — Platform & Product Qualities (`platform`)

**Status:** Draft v1 · **Owner:** Product · **Scope:** MVP
**Traces to:** [`../PRD.md`](../PRD.md) — NFR-1…NFR-6, and FR-1.3 (tenant isolation)
**Depends on:** — (this is the foundation every other module relies on)

---

## 1. Problem & why it matters

Some of Tankha's promises don't belong to any one feature — they're qualities the whole
product must have for HR to trust it. It has to stay fast at 10,000 employees (Excel
doesn't), it must never silently corrupt data, every salary change must be attributable,
and money in different currencies must never get blended into a nonsense number.

If any of these break, the feature on top doesn't matter — a beautiful dashboard over
corrupted or leaked data is worse than the spreadsheet it replaced. This "module" is the
set of cross-cutting guarantees, defined once so every other module inherits them
instead of re-solving (or forgetting) them.

## 2. Users & jobs-to-be-done

**Primary user:** HR Manager (experiences these as *"the product is fast, correct, and
trustworthy"*, not as features).

- *"I want it to stay quick even with all 10,000 people loaded."*
- *"I want to trust that a number I see is real and hasn't been silently mangled."*
- *"I want each currency handled correctly, not mashed together."*

## 3. Product qualities & success metrics

These are the non-functional guarantees, stated as measurable outcomes.

| Quality | Requirement | Target / definition of done |
| --- | --- | --- |
| **Scale** (NFR-1) | Smooth at 10,000 employees via server-side pagination, search, filter | List & dashboard feel instant (< ~1s perceived) at 10k |
| **Demonstrable scale** (NFR-2) | A generator produces a **10,000-row importable dataset** (same format as the [Data Import & Export](./04-data-exchange.md) sample sheet, just larger) | Scale is demonstrated by importing that file — no auto-populate — which also exercises the import pipeline at 10k. The user-facing sample sheet is a truncated version of the same file |
| **Multi-currency** (NFR-3) | Each employee mapped to a country + currency; amounts shown per currency, **no FX** | No screen ever sums across currencies |
| **Data integrity** (NFR-4) | Constraints + transactional writes (especially imports) | No partial/half-written records; invalid data can't persist |
| **Auditability** (NFR-5) | Salary changes are timestamped and attributable | Every change answers who / when / old → new / why |
| **Tenant isolation** (FR-1.3) | All data scoped to one organisation | 0 cross-tenant reads across every route and export |
| **Tech constraints** (NFR-6) | Relational DB, React/Next.js UI, fast deterministic tests, deployed responsive web app | Meets the assignment's stated constraints |

## 4. Shared conventions (so modules stay consistent)

These are product-level decisions every module follows; the exact implementation is a
technical-design concern.

- **Money is always an amount + explicit currency.** No floats, no FX conversion. How a
  currency is formatted for display is a presentation detail; the value is never
  ambiguous about which currency it is.
- **Lists behave the same everywhere.** One consistent approach to pagination, sorting,
  search, and filtering, so every list in the product feels the same and stays fast.
- **Errors are clear, not cryptic.** Failures surface as understandable messages, never
  raw internal detail.
- **Every record carries its provenance.** Creation/update timestamps and, where it
  matters, the acting user — the raw material for auditability.

## 5. Out of scope (MVP)

Rate limiting, refresh-token rotation, an observability/monitoring stack, feature flags,
and internationalisation of the UI. (See the out-of-scope list in [`../PRD.md`](../PRD.md).) These matter for a
production SaaS but aren't needed to prove the MVP.

## 6. Dependencies & assumptions

- Every other module (Access through Insights) assumes the tenant boundary, money handling, list
  conventions, and integrity guarantees defined here.
- Assumes the assignment's tech constraints (relational DB, React/Next.js, web-only,
  deployed & demoable) as fixed inputs.

## 7. Risks & open questions

- **Scale is a claim until proven:** the 10k performance promise must be validated
  against the seed dataset early, not assumed.
- **Open question:** is a single "primary currency" concept per org worth introducing to
  simplify per-currency displays later, or does strict per-currency stay clearest?

---

> **Note on scope:** this module intentionally stays at the product-quality level. The
> concrete technical design — data model, framework choices, auth mechanics, API
> contract — lives (or will live) in a separate architecture / tech-design doc, so this
> PRD stays about *what we promise* rather than *how it's built*.
