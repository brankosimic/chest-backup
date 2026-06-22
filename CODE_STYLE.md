# Branko Code Style

## Rules

1. Always follow security best practices
2. Do not introduce code that exposes or logs secrets and keys
3. Do not commit secrets or keys to the repository
4. Do not use `any` type in TypeScript
5. Do not use inline types; define interfaces or types instead
6. Place all interfaces and type definitions in `src/types/` — one file per logical domain is encouraged, but they must live under this directory
7. Do not add comments that restate what the code already says; comments explaining non-obvious intent, magic values, or behavior not self-evident from the code are allowed
8. Follow the existing code style, conventions, and patterns in the codebase
9. Use existing libraries and utilities
10. Avoid code duplication by extracting reusable functions
11. Do not create nested functions, except when wrapping callbacks in a Promise (e.g., `new Promise((resolve, reject) => { stream.on("data", ...) })`)
12. Use arrow functions instead of normal ones
13. Loops that have more than 4 lines of code inside, move into its own functions
14. Do not prefer passing functions as parameters, except for event emitters/callbacks (e.g., `stream.on("data", ...)`)
15. Inverse condition where possible to reduce nesting
16. Omit curly braces for single-line blocks in conditionals (e.g., `if (x) return;`); this rule does not apply to loops (`for`, `while`, `do...while`), which must always use curly braces
17. Shorten array checks: `if (arr && arr.length > 0)` → `if (arr?.length)`, `if (!arr || arr.length === 0)` → `if (!arr?.length)`, `(arr.length === 0)` → `!arr.length`, `(arr.length !== 0)` → `!!arr.length`
18. Function should not have more than 50 lines of code (does not apply to frontend components and hooks)
19. Order code structures: imports first, then variables, then functions
20. Consolidate all exports into a single block at the very end of the file — do not use `export` inline with declarations. Use `export { X, Y }` as a single grouped statement. Exception: files that contain only `export interface` and `export type` declarations (no `export const`, `export function`, or `export class`) are exempt. Also exempt: `index.ts` files in `src/types/` directories.
21. Use spread operator (`...`) instead of manually mapping each property
22. Avoid identity map when possible (e.g., `items` instead of `items.map(x => ({ ...x }))`)
23. Prefer `&&` over ternary for simple conditionals (e.g., `condition && { create: items }` instead of `condition ? { create: items } : undefined`)
24. Module-level `await` is allowed for initialization patterns (e.g., cache warming at startup)
25. A function's caller should never need more than a single line to use it; error handling, logging, and side effects belong inside the function, not at every call site
26. Leave a blank line before loop blocks (`for`, `while`) to separate them from preceding variable declarations
27. Do not use empty `try`/`catch` blocks; if a catch block is empty, log the error at minimum
28. Extract Tailwind `className` combinations from JSX elements into a separate component styles file when the className contains more than one class or appears in multiple locations; name the file `<ComponentName>.styles.ts` and export the class string as a named constant
29. Do not create type aliases for array types (e.g., `type Grouped = SomeType[]`) — use the array type directly
30. Do not append `ClassName` to style constant names; use descriptive semantic names instead (e.g., `title` not `titleClassName`, `card` not `cardClassName`, `button` not `buttonClassName`)
31. When a `.styles.ts` file exports more than 4 named constants and a component imports them, use `import * as styles from "./...styles"` namespace import and access constants via `styles.{name}` instead of listing individual imports
32. Use array methods for membership checks: instead of `x === "A" || x === "B" || x === "C"`, use `["A", "B", "C"].includes(x)`
33. Use enums for hardcoded string values that appear multiple times — avoid magic strings scattered throughout the codebase
34. All user-facing text in the frontend must be translated via `react-i18next` (i.e., use `useTranslation()` and `t("key")`) — never hardcode display strings, labels, messages, or UI copy directly in JSX/TSX files; add keys to the appropriate namespaced JSON file under `frontend/src/locales/{en|bs}/` for both supported languages
35. When a connected component tree (components sharing state or callbacks) receives more than 4 props, extract them into a React Context to avoid prop drilling; define a typed context with `createContext<T>()`, provide it at the lowest common ancestor, and consume with a custom hook (e.g., `useWizard`)
36. A function should be self-sufficient — handle its own error handling, logging, resource cleanup, and side effects so the caller can use it in a single line
37. Do not use barrel re-exports — every file must export its own declarations, never re-export from another module via `export { ... } from "..."`. Exception: `index.ts` files that serve as the public API entry point for a monorepo shared package may re-export from sub-modules within that same package.
38. Extract reusable helper functions into `src/utils/` — do not define shared helpers inline in route handlers, components, or other files
39. Prefer database-side computation over in-memory processing — use stored procedures for queries that involve joins, aggregations, or conditional logic; avoid raw SQL strings in route handlers and inline queries in ORM calls. Use `GROUP BY`, `JOIN`, and window functions only within stored procedures. Only fetch in-memory when the dataset is small enough that DB-side vs in-memory makes no practical difference (e.g., lookups for a handful of rows)
40. Do not destructure an object if it has more than 4 properties — keep the reference and use dot notation (`ref.prop`). This ensures call sites are consistent and avoids the temptation to add more destructured fields later.
