Rules (non-negotiable):
1. strict TypeScript — no `any`, use `unknown` then narrow
2. All async functions return Promise<T> with explicit T
3. Zod schemas are the single source of truth for types
   — infer types from schemas, never duplicate
4. No type assertions (as Type) unless absolutely necessary
5. Discriminated unions for error handling, not try/catch chains
6. Private class members prefixed with # or marked private
7. Readonly where state should not mutate
8. No non-null assertions (!) — handle null explicitly
9. Interface for objects, type for unions/primitives
10. Export types separately from implementation