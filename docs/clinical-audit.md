# ConvertLAB clinical validation and release audit

This document describes the validation gates introduced in phases 40–54.

## Registry integrity

Every registered calculator is checked for:

- unique calculator ID
- non-empty name and description
- at least one declared input
- unique input IDs
- valid numeric ranges
- valid select options
- valid taxonomy/subcategory assignment
- callable calculation function
- self-referential related-tool links

The automated registry audit lives in `lib/calculators/validation.ts` and `lib/calculators/clinical-audit.ts`.

## Reference coverage

Every registered calculator now resolves to at least one source metadata record through `getCalculatorReferences()`.

Reference status is explicit:

- `current` — source is treated as current for the stated scope
- `supporting` — source provides supporting methodology or protocol context
- `review-needed` — a category-level reference is present, but a calculator-specific primary source still needs verification

A category-level reference must **not** be interpreted as proof that every formula in that category has been independently clinically validated.

## Production safety

The production application now includes:

- a route-level error boundary
- loading UI
- `/api/health` health endpoint
- `robots.txt` generation
- `sitemap.xml` generation
- basic security response headers
- `poweredByHeader` disabled
- TypeScript build errors no longer ignored by Next.js configuration

## Search behavior

Calculator search now supports:

- multiple search terms
- category and subcategory intent
- clinical synonyms
- pediatric/paediatric terminology
- antimalarial/malaria terminology
- common spelling mistakes
- partial word matches
- relevance scoring

For example, `pediatric antimalaria` is interpreted as a combined intent and returns the Antimalarial dosing calculators rather than requiring every calculator to contain the literal word `pediatric`.

## Clinical scope limitation

ConvertLAB is a calculation and reference utility. A source reference, formula, score, or regimen entry does not constitute an independent clinical validation of a patient's treatment plan. Current product information, guidelines, validated laboratory methods, institutional SOPs, and professional judgment remain authoritative.

## Release gate

Before a production release, run the full Vitest suite and a clean Next.js production build in an environment with the project's locked dependencies installed. The repository intentionally does not suppress TypeScript build errors.
