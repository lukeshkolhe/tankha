# Module Architecture — Dashboard & Analytics (`insights`)

**Status:** Draft v1 · **Scope:** MVP
**Traces to:** [`../PRD.md`](../PRD.md) FR-5.1–5.3 · [`05-insights PRD`](../module-PRDs/05-insights.md)
**Depends on:** [`workforce`](./02-workforce.md), [`compensation`](./03-compensation.md) (read-only), [`platform`](./00-platform.md)

A pure read-side over the employee + salary data. It owns **no tables** and never writes —
it turns the system of record into an instant picture of *how the org pays people*,
strictly per currency (never a blended cross-currency total).

---

## 1. Backend (Clean Architecture layers)

```
backend/src/insights/
  domain/
    pay-insight.ts             CurrencyGroup { currency, headcount, totalMinor, averageMinor }
    breakdown.ts               BreakdownRow { dimension, currencyGroups[] }
    insight.repository.ts      InsightRepository port (overview, byDepartment, byCountry)
  application/
    get-overview.usecase.ts    Headcount + per-currency total/average
    get-department-breakdown.usecase.ts
    get-country-breakdown.usecase.ts
    dto/                       InsightsFilter, OverviewView, BreakdownView
  infrastructure/
    prisma-insight.repository.ts  Tenant-scoped GROUP BY aggregations (SQL, not in-app)
  interface/
    insights.controller.ts     Read-only GET endpoints
    dto/                       InsightsFilterDto (shares whitelist with workforce filters)
  insights.module.ts
```

**Aggregation happens in the database**, not in application code — `GROUP BY currency`
(and by `departmentId` / `countryCode`) over `Employee ⋈ SalaryStructure`, filtered by
`organisationId` and the shared filter set. This keeps the dashboard under the < 1s bar at
10k rows, backed by the `SalaryStructure([organisationId, currencyCode])` and employee
composite indexes ([`database-schema.md`](./database-schema.md)).

**Per-currency by construction.** Every monetary aggregate is grouped by `currencyCode`;
there is no query path that sums across currencies. Headcount, a count, is
currency-agnostic. `averageMinor` is integer division within a currency group. This is the
same guarantee the platform `Money` VO enforces in the write side — here it is enforced by
always carrying `currency` as a `GROUP BY` key.

**Consistency with the list.** `InsightsFilter` uses the **same** whitelisted
filter/search fields as `workforce`'s `ListEmployeesQuery`, so the dashboard and the
employee list always describe the same filtered population (a trust requirement).

---

## 2. API contract

`Authorization: Bearer <jwt>`, tenant-scoped. All accept the shared filter params
(`search`, `department`, `country`, `status`) — no pagination (aggregates are small).

### `GET /insights/overview` — headcount + per-currency comp (FR-5.1)
```jsonc
// 200
{
  "headcount": 10000,
  "byCurrency": [
    { "currency": "INR", "headcount": 6200, "totalMinor": 74400000000, "averageMinor": 1200000 },
    { "currency": "USD", "headcount": 2100, "totalMinor": 18900000000, "averageMinor": 9000000 },
    { "currency": "EUR", "headcount": 1700, "totalMinor": 14450000000, "averageMinor": 8500000 }
  ]
}
```
No field ever sums `totalMinor` across the `byCurrency` rows.

### `GET /insights/by-department` — breakdown (FR-5.2)
```jsonc
// 200
{
  "breakdown": [
    { "dimension": "Engineering",
      "currencyGroups": [
        { "currency": "INR", "headcount": 3200, "totalMinor": 41600000000, "averageMinor": 1300000 },
        { "currency": "USD", "headcount": 900,  "totalMinor": 9000000000,  "averageMinor": 10000000 }
      ] },
    { "dimension": "Sales",
      "currencyGroups": [ { "currency": "INR", "headcount": 1500, "totalMinor": 15000000000, "averageMinor": 1000000 } ] }
  ]
}
```

### `GET /insights/by-country` — breakdown (FR-5.2)
Same `BreakdownView` shape, `dimension` = country name; each `currencyGroups` typically has
a single currency but the per-currency structure is kept uniform.

---

## 3. Frontend (`features/insights`)

```
frontend/src/features/insights/
  routes/
    DashboardPage.tsx        The landing page after login
  components/
    OverviewCards.tsx        Headcount + per-currency total/average stat tiles
    DepartmentBreakdown.tsx  Table + chart (follows the `dataviz` skill guidance)
    CountryBreakdown.tsx     Table + chart, currency always explicit
    InsightsFilters.tsx      Reuses the same filter controls as the employee list
  api/
    useOverview.ts           useQuery(['insights','overview', urlParams]) → GET /insights/overview
    useDepartmentBreakdown.ts
    useCountryBreakdown.ts
```

- **Shared URL filters.** The dashboard reads the **same** React Router search params as the
  employee list, so drilling in one reflects in the other and the two never disagree
  (FR-5.3). The URL params are the TanStack Query keys.
- **Currency is always explicit** on every money figure; per-currency rows are rendered as
  separate tiles/rows — the UI has no control that would produce a blended total.
- **Charts** follow the `dataviz` guidance (per-currency series, accessible palette). Money
  is formatted from `amountMinor` using `Currency.minorUnitDigits` + `symbol`.

---

## 4. Traceability

| Requirement | Realised by |
| --- | --- |
| FR-5.1 overview stats (headcount, total, average) | `GetOverviewUseCase` — per-currency groups |
| FR-5.2 breakdowns by department & country | `GetDepartmentBreakdown` / `GetCountryBreakdown` (DB `GROUP BY`) |
| FR-5.3 filter/search consistent with list | shared `InsightsFilter` = `workforce` filter set + URL state |
| NFR-3 no cross-currency totals | every aggregate grouped by `currencyCode`; no summing path exists |

Out of scope (PRD): NL/AI query assistant, pay-equity analysis, budget-vs-actual, YoY
trends, custom report builder, any cross-currency grand total.
