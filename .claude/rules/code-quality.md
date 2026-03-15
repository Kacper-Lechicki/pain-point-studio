---
description: Code quality standards — formatting, comments, DRY, testing, structure consistency
---

# Code Quality Rules

## Comments

- **Components: zero comments.** Code must be self-explanatory through naming and structure.
- Elsewhere: comments only when the _why_ is non-obvious. Never comment _what_ code does.
- No commented-out code. No TODO/FIXME — track in issues instead.
- No JSDoc on internal functions. Only on shared utilities where the contract isn't obvious from types.

## Whitespace & Formatting

- Blank line between multiline elements (objects, functions, JSX blocks, type definitions).
- Single-line elements of the same kind can be adjacent without blank lines.
- Blank line before `return` when function body has preceding logic.
- No consecutive blank lines.

```tsx
// ✅ correct
const name = 'value';
const count = 0;

const config = {
  key: 'value',
  nested: { a: 1 },
};

const other = {
  key: 'value',
};

// ❌ wrong — no blank line between multiline elements
const config = {
  key: 'value',
};
const other = {
  key: 'value',
};
```

## DRY & Reusability

- **3+ similar blocks = must refactor. 2 = use judgement** (refactor if structure is identical and unlikely to diverge).
  - Similar components → reusable component with props/config
  - Similar logic → shared utility in `lib/` or `src/lib/common/`
  - Similar types → generic type with parameters
  - Similar config → data-driven pattern (array of config objects rendered in a loop)
- Prefer composition over props explosion. If a component needs >5 boolean props to control variants, split into composed components or use a config object.
- Prefer iterating over config arrays over repeating JSX (3+ items):

```tsx
// Good — config-driven for 3+ similar items
const FIELDS = [
  { name: 'title', label: t('title'), type: 'text' },
  { name: 'description', label: t('description'), type: 'textarea' },
  { name: 'slug', label: t('slug'), type: 'text' },
] as const;

{
  FIELDS.map((field) => <FormField key={field.name} {...field} />);
}
```

- Don't abstract when blocks will likely diverge, or when the abstraction is harder to read than the repetition.

## Structure Consistency

- Sibling folders must follow the same internal structure. If `projects/` has `actions/`, `components/`, `config/`, `types/` — a new feature with the same needs must mirror that layout.
- Files of the same kind must follow the same internal structure (import order, type definitions, exports).
- When adding a new feature, use an existing feature of similar complexity as a template.

## Testing

- **Every file in `**/lib/`, `**/actions/`, `**/hooks/` MUST have a co-located unit test** (`foo.ts`→`foo.test.ts`). No exceptions.
  - The only exempt files are: `index.ts` barrel re-exports, and pure type-only files (files that export only `type`/`interface` with zero runtime logic).
  - Server actions (wrapped with `withProtectedAction`/`withPublicAction`) must be tested by mocking the Supabase client and verifying the query/mutation logic.
  - Context provider hooks must be tested by rendering with the provider and asserting state changes.
  - Pure utility functions must be tested with input/output assertions.
- E2E tests for: complete user flows (auth → create → edit → delete), critical paths that cross feature boundaries.
- Test file structure must mirror source structure: `use-form-action.ts` → `use-form-action.test.ts`.
- When creating a new file in `lib/`, `actions/`, or `hooks/`, always create the `.test.ts` file alongside it in the same PR.

## Component Size & Extraction

- Max ~150 lines per component file. Extract sub-components into the same folder when exceeded.
- Extract when a JSX block is reused, has independent state, or makes the parent hard to read.
- Extracted sub-components stay in the same feature folder — don't promote to shared until a second feature needs it.

## Minimal Code Principles

- Delete dead code immediately. Don't keep "just in case" functions, types, or imports.
- Prefer built-in/framework solutions over custom implementations (Next.js caching, React hooks, Zod transforms).
- One responsibility per file. Exception: schema + inferred type for the same domain belong together in `types/`.
- Avoid wrapper abstractions that add no value. If a wrapper just forwards props/calls, remove it.

## Documentation Upkeep

- After any key change (new command, env var, dependency, architecture pattern, convention), update the affected docs **in the same session**: `CLAUDE.md`, `docs/DEVELOPER_GUIDE.md`, and/or the relevant `.claude/rules/*.md` file.
- See the full mapping of change types → docs to update in the "Documentation Upkeep" section of `CLAUDE.md`.
- Never create new documentation files — all technical docs live in `docs/DEVELOPER_GUIDE.md`.

## Git Operations

- **Never execute git operations.** No `git commit`, `git push`, `git pull`, `git merge`, `gh pr create`, or any other git/GitHub CLI commands.
- The developer handles all version control: commits, pushes, PRs, branching, rebasing, etc.
- Only read-only git commands for context are acceptable (`git status`, `git log`, `git diff`, `git blame`).
