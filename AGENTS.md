# Engineering Rules

1. Correctness over cleverness.
2. No feature without PRODUCT.md justification.
3. Source data is immutable.
4. Derived data must preserve provenance.
5. Scheduled jobs must be idempotent.
6. Never silently swallow ingestion errors.
7. Never fabricate missing data.
8. Heuristic scores must expose their inputs.
9. LLM extraction, if later added, must use validated structured output.
10. UI must work completely with deterministic seed data.
11. Operator Mode must not imply active job searching.
12. Private Career data must never accidentally render in Operator Mode.
13. Run lint, typecheck, tests, and production build after meaningful changes.
14. Keep setup instructions current.
15. Prefer simple boring architecture.
16. Do not introduce microservices without explicit approval.
17. Do not introduce new paid infrastructure without explicit approval.
18. Do not add features beyond the v0 product contract during bootstrap.
