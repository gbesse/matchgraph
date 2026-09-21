# AI changelog

Implementation decisions and validation for this project.

## 2026-09-21 — First public alpha

- Purpose: Build evidence-backed, scoped product-equivalence graphs without inferring unverified compatibility.
- Reuse the pinned DecisionPacks provider for model calls, deadlines and response validation.
- Native Node.js modules and public TypeScript declarations; no build.
- Provide working immutable JSON CLI workflows, offline fixtures and optional typed Jev adapters.
- Validate SDK declarations, syntax, 14 tests, actual HTTP serialization against a local server, and the offline demo.
- Configure Node.js 22/24 CI; publish as a GitHub alpha with explicit trust and integration boundaries.
