# Why Tankha?

ACME's HR team runs salary for 10,000 employees across multiple countries entirely
in spreadsheets. At that scale, Excel stops being a tool and starts being a liability.
These are the pain points Tankha sets out to solve.

## Data integrity & accuracy
- **No validation** — a typo, a wrong formula, or a dragged-cell error can silently corrupt salary data across hundreds of rows.
- **No single source of truth** — versions multiply (`v1`, `v2_final`, `v2_final_ACTUAL`) over email and Slack, and no one is sure which is current.
- **Errors compound at scale** — a broken `VLOOKUP` or a stray cell reference stays invisible until someone notices a paycheck is wrong.

## Querying & analysis
- **Every question is manual** — "What's our average CTC in Engineering vs. Sales?" or "Who got a raise over 15% last cycle?" means filtering and pivoting by hand, every single time.
- **No historical view** — overwrite a salary cell and the old value is gone, unless someone kept a separate change log by hand.
- **Cross-referencing is fragile** — correlating salary with tenure, department, or location relies on `VLOOKUP`s and manual joins that break easily.

## Collaboration & access control
- **No access control** — anyone with the file sees and edits everyone's pay; splitting into per-department files just creates new copies that drift out of sync.
- **No audit trail** — there's no easy way to answer "who changed this salary, when, and why."
- **Editing conflicts** — two people in the same sheet can overwrite each other's changes, especially with `.xlsx` files passed around over email.

## Scale
- **Excel buckles before 10,000 rows** — heavy formulas and conditional formatting make it sluggish and error-prone.
- **Bulk updates are risky** — an annual increment cycle is one bad paste or drag-fill away from corrupting thousands of records, with no rollback.

## Process & compliance risk
- **No guardrails** — nothing stops an invalid designation, a negative salary, or a duplicate employee ID from being entered.
- **Weak audit readiness** — without a timestamped change history, it's hard to demonstrate proper controls to auditors.

## Multi-country & multi-currency
- **Currencies collide in one sheet** — pay for employees across countries sits in a single file with no consistent per-currency handling, making regional comparisons manual and error-prone.
- **No per-country view** — seeing how each country or region is paid means slicing and re-pivoting the sheet by hand every time.

---

**Tankha replaces the spreadsheet with a single, validated system of record** — one
source of truth for salary data, a clear dashboard to explore how the org pays people,
a tracked history of every salary change, and safe bulk import/export to bridge the
move away from Excel.
