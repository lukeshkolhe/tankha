# Tankha — Salary Management System: Discovery Questions

> **Purpose:** Collect every open question before we commit to scope, so the problem
> statement and PRD are built on decisions, not assumptions.
> **Product:** Web-based salary/compensation management software for ACME (~10,000
> employees, multiple countries). Primary user: HR Manager.
> **Legend:** ★ = question raised by the product owner.

---

## A. Product Scope & Vision
1. Is this only a **system of record + reporting** (store, organize, analyze salary data), or must it also **run payroll** (calculate net pay) and **disburse money** to employees?
2. What is the meaning of "System should be able to answer questions about how the org pays people."
    a. System shows all the information and the HR Manager can just view
    b. HR manager can ask questions to an AI agent who has access to this complete data?

## B. Users, Roles & Permissions
5. Besides the **HR Manager**, who else uses the system — HR admins/analysts, Finance/Comp team, people managers, executives, auditors?
6. Do employees get self-service (payslips, tax declarations, letters)?
8. **Who can see whose salary?** Do we need role-based access and field-level masking of sensitive pay data?

## C. Employee & Org Data
9. ★ We'll need a **module to import existing employee data from Excel sheets.** What columns/attributes must it accept, and how do we validate/clean/deduplicate on import?
10. Is the Excel import a **one-time migration**, or an ongoing way to bulk-update?
12. Must we keep **full salary history over time** (effective-dated records, not just the latest number)?

## D. Salary / Compensation Structure
13. ★ Do we model specific **allowances and components** — HRA, PF, insurance, food card, travel, and others? Should these be a **configurable list** so HR can add/edit components without engineering?
14. Which components are **taxable vs. non-taxable**, and which are **employer vs. employee** contributions?
15. Do we handle **fixed + variable pay** (bonus, commission, incentives) and **equity/ESOPs**?
16. Do we use **pay grades/bands** with min–mid–max ranges, and flag employees outside their band?
17. How is a full **salary structure (CTC → gross → net)** defined and broken down?

## E. Taxes & Statutory Compliance
18. ★ Will the system **calculate and manage taxes?** Each country has a different tax model, so we'd need a **separate tax module** that stores each country's tax rules and calculation logic.
19. Which **countries** are in scope, and in what **rollout order**?
20. Beyond income tax, which **statutory deductions** per country (e.g. India: PF, ESI, PT, TDS; US: FICA, federal + state)?
22. Do we handle employee **tax declarations / investment proofs** (e.g. India 80C) and **year-end tax documents** (Form 16 / W-2)?

## F. Payroll Run & Disbursement
23. ★ Do we keep a **record of disbursed salary per employee** (what was actually paid, when, how)?
24. Does the system **run the monthly payroll calculation**, or only store numbers entered elsewhere?
25. What are the **pay cycles** per country (monthly, bi-weekly), and do we handle **off-cycle** payments (bonuses, corrections, arrears)?
26. Do we **disburse money** (bank file / payment gateway integration), or just record payments made externally?
27. Do we **generate payslips**, and must payroll be **locked/finalized** after sign-off?
28. Should we handle **overpayment recovery, holds, and stop-payments**?

## G. Employee Lifecycle Events
29. ★ **Appraisals:** allow changing an employee's salary structure on appraisal, and **keep a record of appraisal history** (old vs. new, effective date, approver). Do we also support **bulk revisions** and **arrears**?
30. ★ **Separation:** when an employee leaves, generate a **Full & Final (FnF) settlement** — notice pay/recovery, remaining dues, leave encashment, gratuity — and **mark the employee as separated** (and revoke access).
31. **Onboarding:** add new joiners mid-cycle with **pro-rated** salary?
32. **Promotions/transfers:** handle department, location, or **country/currency** changes?
33. Do we track **loans/advances** and recover them from salary? Impact of **unpaid leave (LOP)**?

## H. Reporting, Analytics & Export
34. ★ **Export** salary data for a **month, year, or custom period**, and also **view the same on the system** (dashboards/tables). What export formats — Excel, CSV, PDF?
35. The original goal is to *"answer questions about how the org pays people."* **Which specific questions?** e.g.:
    - Payroll **cost by country / department / cost center**
    - **Budget vs. actual** compensation spend
    - **Pay equity / gender pay gap** (legally required in some countries)
    - Who is **above/below their pay band**
    - **Year-over-year** compensation growth

## I. Multi-Country & Localization
38. Do we support **multiple currencies + FX conversion** — which rate source, applied when?
39. Are there **data residency / privacy** laws to respect (GDPR in EU, DPDP in India)?
40. Do we need **local languages, date, and number formats**?

## J. Security, Audit & Compliance
41. Do we need a full **audit trail** (who changed what, when) for all salary data?
42. What **encryption / PII protection** is required at rest and in transit?
43. Are **compliance certifications** expected (SOC 2, ISO 27001)?
44. What are the **data retention and deletion** policies?

## K. Integrations
48. Do we connect to **banks / payment providers** for disbursement?

## L. Non-Functional Requirements
51. **Web only**, or also **mobile** (especially for employee self-service)?

---