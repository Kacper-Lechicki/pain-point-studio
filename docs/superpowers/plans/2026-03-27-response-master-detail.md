# Response Master-Detail Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the table + modal survey responses UI with a master-detail split layout, matching the Questions tab visual language.

**Architecture:** Two-pane split on desktop (list pane ~340px + detail pane flex-1), stacked navigation on mobile (<md). Existing data layer (hooks, actions, types) unchanged. Answer display enhanced with chart-style visualizations matching the Questions tab.

**Tech Stack:** React 19, Tailwind CSS v4, Lucide icons, next-intl, existing Supabase server actions

**Spec:** `docs/superpowers/specs/2026-03-27-response-master-detail-design.md`

---

## File Structure

### Create

| File                                                               | Responsibility                                                                                                        |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `src/features/surveys/lib/response-formatting.ts`                  | Shared utilities: `formatDuration`, `formatRelativeTime`, `DEVICE_ICONS` — extracted from 3 files that duplicate them |
| `src/features/surveys/lib/response-formatting.test.ts`             | Unit tests for formatting utilities                                                                                   |
| `src/features/surveys/components/stats/response-list-item.tsx`     | Single list item card with labeled answer previews                                                                    |
| `src/features/surveys/components/stats/response-list-pane.tsx`     | Left pane: header + scrollable list + loading/empty states                                                            |
| `src/features/surveys/components/stats/response-detail-header.tsx` | Detail pane header: title, status badge, meta row                                                                     |
| `src/features/surveys/components/stats/response-detail-body.tsx`   | Scrollable question cards with chart-style answer display                                                             |
| `src/features/surveys/components/stats/response-detail-nav.tsx`    | Prev/next footer with keyboard navigation                                                                             |
| `src/features/surveys/components/stats/response-detail-pane.tsx`   | Right pane orchestrator: fetches detail, composes header + body + nav                                                 |

### Modify

| File                                                                | Change                                                                                   |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/features/surveys/components/stats/responses-tab.tsx`           | Replace table/dialog/card orchestration with split layout                                |
| `src/features/surveys/components/stats/response-answer-display.tsx` | Enhance with chart-style visualizations (ring charts, bar distribution, horizontal bars) |

### Delete (after migration complete)

| File                                                               | Reason                             |
| ------------------------------------------------------------------ | ---------------------------------- |
| `src/features/surveys/components/stats/responses-table.tsx`        | Replaced by `response-list-pane`   |
| `src/features/surveys/components/stats/response-card-row.tsx`      | Replaced by `response-list-item`   |
| `src/features/surveys/components/stats/response-detail-dialog.tsx` | Replaced by `response-detail-pane` |

---

## Task 1: Extract shared formatting utilities

**Files:**

- Create: `src/features/surveys/lib/response-formatting.ts`
- Create: `src/features/surveys/lib/response-formatting.test.ts`

This extracts `formatDuration`, `formatRelativeTime`, and `DEVICE_ICONS` which are currently duplicated across `responses-table.tsx`, `response-card-row.tsx`, and `response-detail-dialog.tsx`.

- [ ] **Step 1: Write tests for formatting utilities**

Create `src/features/surveys/lib/response-formatting.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { formatDuration, formatRelativeTime } from './response-formatting';

describe('formatDuration', () => {
  it('returns dash for null', () => {
    expect(formatDuration(null)).toBe('—');
  });

  it('formats seconds under 60', () => {
    expect(formatDuration(5)).toBe('5s');
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats minutes', () => {
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(90)).toBe('1m 30s');
  });

  it('formats hours', () => {
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(5400)).toBe('1h 30m');
  });
});

describe('formatRelativeTime', () => {
  it('returns dash for null', () => {
    expect(formatRelativeTime(null)).toBe('—');
  });

  it('returns "just now" for < 60s ago', () => {
    const now = new Date();
    expect(formatRelativeTime(now.toISOString())).toBe('just now');
  });

  it('returns minutes for < 1h ago', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(date.toISOString())).toBe('5m ago');
  });

  it('returns hours for < 24h ago', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(date.toISOString())).toBe('3h ago');
  });

  it('returns days for < 7d ago', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(date.toISOString())).toBe('2d ago');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit -- src/features/surveys/lib/response-formatting.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create the shared utility module**

Create `src/features/surveys/lib/response-formatting.ts`. Extract the `formatDuration` and `formatRelativeTime` functions from `responses-table.tsx` (lines 43–94) and the `DEVICE_ICONS` constant (lines 37–41). Copy them exactly — no logic changes.

```typescript
import { Monitor, Smartphone, Tablet } from 'lucide-react';

import type { DeviceType } from '@/features/surveys/types/response-list';

export const DEVICE_ICONS: Record<DeviceType, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

export function formatDuration(seconds: number | null): string {
  // exact copy from responses-table.tsx lines 47–68
}

export function formatRelativeTime(dateStr: string | null): string {
  // exact copy from responses-table.tsx lines 70–94
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:unit -- src/features/surveys/lib/response-formatting.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Update existing imports**

Replace the duplicated `formatDuration`, `formatRelativeTime`, and `DEVICE_ICONS` in these files with imports from the new module:

- `src/features/surveys/components/stats/responses-table.tsx` — remove lines 37–94, add import
- `src/features/surveys/components/stats/response-card-row.tsx` — remove lines 10–67, add import
- `src/features/surveys/components/stats/response-detail-dialog.tsx` — remove lines 48–74, remove `Monitor, Smartphone, Tablet` from lucide import, add import from `response-formatting`

- [ ] **Step 6: Run full tests to verify no regressions**

Run: `pnpm test:unit`
Expected: All existing tests pass

- [ ] **Step 7: Commit**

```
feat: extract shared response formatting utilities
```

---

## Task 2: Enhance response-answer-display with chart visualizations

**Files:**

- Modify: `src/features/surveys/components/stats/response-answer-display.tsx`

Redesign the answer display to match the Questions tab visual style. Each answer renders inside a card with question number, type badge, and chart-style visualization.

Reference for visual patterns:

- `src/features/surveys/components/stats/answer-charts/yes-no-chart.tsx` — ring chart + colored bars
- `src/features/surveys/components/stats/answer-charts/rating-distribution-chart.tsx` — ring chart + bar distribution
- `src/features/surveys/lib/rating-helpers.ts` — `getSentimentKey`, `getSentimentColor`, `getRingColor`, `getBarColor`
- `src/features/surveys/config/question-types.ts` — `QUESTION_TYPE_ICONS`, `QUESTION_TYPE_LABEL_KEYS`
- `src/features/surveys/config/constraints.ts` — `RATING_THRESHOLDS`

- [ ] **Step 1: Add `index` prop and card wrapper**

Update the `ResponseAnswerDisplayProps` interface to accept an `index` number. Wrap the entire component in a card container matching the Questions tab card style:

```tsx
interface ResponseAnswerDisplayProps {
  answer: ResponseAnswer;
  index: number;
  compact?: boolean;
}
```

When `compact` is true (used on mobile detail view), simplify the visualizations:

- **Rating:** show only the ring + value + sentiment label. Hide the bar distribution chart.
- **Yes/No:** show ring at 40px instead of 48px.
- **Multiple choice:** show selected options as simple badges instead of horizontal bars.
- Card padding: `px-3 py-2.5` instead of `px-4 py-3`.

Card wrapper classes: `border-border/70 bg-card rounded-lg border px-4 py-3 shadow-sm sm:px-5 sm:py-4`

Question title: `<p className="text-sm leading-snug font-semibold sm:text-base"><span className="text-muted-foreground tabular-nums">{index + 1}. </span>{answer.questionText}</p>`

Add type badge below title using `QUESTION_TYPE_ICONS` and `QUESTION_TYPE_LABEL_KEYS` from config. Badge: `<Badge variant="secondary">` with the question type icon (size 10px) and i18n label.

**i18n note:** `QUESTION_TYPE_LABEL_KEYS` contains keys like `'surveys.builder.types.yes_no'`. Use `useTranslations('surveys.builder')` as a second translator instance (e.g., `const tBuilder = useTranslations('surveys.builder')`) and call `tBuilder(QUESTION_TYPE_LABEL_KEYS[answer.questionType])` with the suffix part. Check the existing usage in `question-stats-card.tsx` for the exact pattern.

- [ ] **Step 2: Redesign yes_no answer with ring chart**

Replace the badge-only yes/no display with a ring chart + colored label, matching the Questions tab `yes-no-chart.tsx` visual style.

Structure: `flex items-center gap-3 mt-2.5`

- 48px SVG ring chart (full circle in emerald-500 for yes, rose-500 for no)
- Check or X icon in center
- Colored text label ("Yes" / "No")

Ring SVG: viewBox `0 0 36 36`, circle `cx=18 cy=18 r=14`, stroke-width 4, rotated -90deg. Full `stroke-dasharray="88"` since this is a single response (100%).

- [ ] **Step 3: Redesign rating_scale answer with ring + bar distribution**

Replace stars with ring chart + value display + single-highlight bar distribution.

Import `getSentimentKey`, `getSentimentColor`, `getRingColor`, `getBarColor` from `@/features/surveys/lib/rating-helpers`.

Top section (`flex items-center gap-3 mt-2.5`):

- 48px ring chart with color from `getRingColor(rating / maxRating)`
- Ring stroke-dasharray: `(rating / maxRating) * 88`
- Center text: rating value (14px, bold)
- Right of ring: large rating value (`text-xl font-bold tabular-nums`) + `/ maxRating` + sentiment label from `getSentimentKey` with color from `getSentimentColor`

Bar distribution (`flex items-end gap-1 h-[100px] mt-3`):

- One column per scale value (1 to maxRating)
- The respondent's selected value gets a tall bar (e.g., 70px) with full color from `getBarColor`
- All other values get a 3px muted bar (opacity 0.15)
- Count label above each bar: "1" for selected, "0" (muted) for others
- Scale label below: the value number, active style on selected

- [ ] **Step 4: Redesign multiple_choice with horizontal bar chart**

Replace badges with horizontal bar chart matching `choice-distribution-chart.tsx` visual style.

For a single response, show selected options as full bars and unselected (if config provides all options) as empty. If no config options available, just show selected options with full cyan bars.

Each row: option label + "Selected" indicator on left, bar track with fill on right.

- Selected: `bg-cyan-500` fill, `font-medium text-foreground` label
- Not selected: empty track, `text-muted-foreground` label

- [ ] **Step 5: Verify existing text display**

The `open_text`/`short_text` display already uses a muted bg box — keep it as-is but add `mt-2.5` spacing after the header. No visual changes needed beyond the card wrapper and spacing.

- [ ] **Step 6: Run type check**

Run: `pnpm test:types`
Expected: No type errors

- [ ] **Step 7: Commit**

```
feat: enhance response answer display with chart visualizations
```

---

## Task 3: Create response-list-item component

**Files:**

- Create: `src/features/surveys/components/stats/response-list-item.tsx`

A compact card for the list pane showing response meta + labeled answer previews.

- [ ] **Step 1: Create the component**

Props interface:

```tsx
interface ResponseListItemProps {
  item: SurveyResponseListItem;
  index: number;
  isActive: boolean;
  answers: ResponseAnswer[] | null;
  onClick: () => void;
}
```

Note: `answers` comes from the detail data (when available for the selected item) or is null. The list item shows a preview of answers when available, but works without them.

Layout structure:

- Outer: `button` element with role semantics, border-bottom separator
- Active state: 2px left border in primary, subtle blue bg tint (`bg-primary/[0.06]`)
- Hover: `hover:bg-primary/[0.04]`

Row 1: `#index` (12px, semibold, muted) + status badge (using `ResponseStatusBadge`)

Row 2: Meta — relative time + device icon + device label + duration, separated by `·` (11px, muted). Use `formatRelativeTime`, `formatDuration`, `DEVICE_ICONS` from `response-formatting.ts`.

Row 3 (if answers provided): Labeled answer preview rows. For each answer:

- Label: truncated question text (11px, `text-muted-foreground`, max-width 120px, ellipsis)
- Value: formatted answer summary (11px):
  - yes_no: "Yes" in emerald or "No" in rose
  - rating_scale: "N / Max" format
  - open_text/short_text: truncated text (ellipsis)
  - multiple_choice: comma-joined selected options (truncated)
  - skipped: italic muted "skipped"

Use `getAnswerPreview(answer: ResponseAnswer): { text: string; className: string }` helper function inside the file.

- [ ] **Step 2: Commit**

```
feat: add response list item component
```

---

## Task 4: Create response-list-pane component

**Files:**

- Create: `src/features/surveys/components/stats/response-list-pane.tsx`

Left pane of the split layout. Contains header with count/sort and scrollable list.

- [ ] **Step 1: Create the component**

Props interface:

```tsx
interface ResponseListPaneProps {
  items: SurveyResponseListItem[];
  totalCount: number;
  selectedId: string | null;
  isLoading: boolean;
  hasLoaded: boolean;
  startIndex: number;
  cachedAnswers: Record<string, ResponseAnswer[]>;
  onSelect: (item: SurveyResponseListItem) => void;
}
```

Layout:

- Outer: `flex flex-col` with fixed width on desktop (`w-[340px] shrink-0`), full width on mobile
- Border right on desktop: `md:border-r md:border-border`
- Header: count label (`text-xs font-semibold`) — `"{totalCount} responses"`
- Body: `flex-1 overflow-y-auto` scrollable list
- Loading state: 4-5 skeleton items matching the list item layout
- Empty state (items = 0 after load): muted centered text

Map items → `ResponseListItem`, passing `isActive={item.id === selectedId}`, `answers={cachedAnswers[item.id] ?? null}`, index calculated from `startIndex + idx`.

**Data flow for answer previews:** When `ResponseDetailPane` fetches a response's detail, it calls `onDetailLoaded` which the parent (`responses-tab`) uses to cache the answers in a `Record<string, ResponseAnswer[]>` state. This cache is passed down to the list pane, so previously-viewed items show answer previews. Items not yet viewed show no answer previews (Row 3 simply doesn't render).

- [ ] **Step 2: Commit**

```
feat: add response list pane component
```

---

## Task 5: Create response detail pane components

**Files:**

- Create: `src/features/surveys/components/stats/response-detail-header.tsx`
- Create: `src/features/surveys/components/stats/response-detail-body.tsx`
- Create: `src/features/surveys/components/stats/response-detail-nav.tsx`
- Create: `src/features/surveys/components/stats/response-detail-pane.tsx`

### Detail Header

- [ ] **Step 1: Create response-detail-header**

Props: `{ meta: SurveyResponseListItem }`

Layout: `px-5 py-4 border-b border-border`

Row 1: "Response #N" title (15px semibold) + status badge (right-aligned)
Row 2: Meta with separators — full date (`toLocaleString`), device icon + label, clock icon + duration. All 11px muted. Use `DEVICE_ICONS`, `formatDuration` from `response-formatting.ts`.

Matches existing detail dialog header (lines 149–179 of `response-detail-dialog.tsx`) but without the dialog wrappers.

### Detail Body

- [ ] **Step 2: Create response-detail-body**

Props: `{ detail: ResponseDetail | null; isLoading: boolean; compact?: boolean }`

Pass `compact` through to each `ResponseAnswerDisplay` component.

Layout: `flex-1 overflow-y-auto px-5 py-5`

Content: vertical stack of `ResponseAnswerDisplay` cards with `space-y-3` gap.

Loading state: 3 skeleton cards (matching q-card proportions).
Empty state: centered muted text "No answers yet".

Include feedback section (if `detail.feedback` exists) — bordered section below answers with uppercase label + muted text box. Copy from dialog lines 202–212.

Include contact section (if `detail.contactName || detail.contactEmail`) — bordered section with User icon + name, Mail icon + `ClipboardInput`. Copy from dialog lines 215–237.

### Detail Nav

- [ ] **Step 3: Create response-detail-nav**

Props: `{ currentIndex: number; totalCount: number; canPrev: boolean; canNext: boolean; onNavigate: (direction: 'prev' | 'next') => void }`

Layout: `flex items-center gap-1 border-t border-border px-5 py-3`

Left: prev button (outline, icon-sm) with chevron-left icon
Center: counter "N of Total" (11px muted, tabular-nums)
Right: next button with chevron-right icon

Keyboard navigation effect: listen for ArrowLeft/ArrowRight when this pane is visible, call `onNavigate`. Extract the keyboard handler from dialog (lines 116–136).

### Detail Pane Orchestrator

- [ ] **Step 4: Create response-detail-pane**

Props:

```tsx
interface ResponseDetailPaneProps {
  selectedId: string | null;
  selectedMeta: SurveyResponseListItem | null;
  selectedIndex: number;
  totalItems: number;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  onNavigate: (direction: 'prev' | 'next') => void;
  onDetailLoaded?: (detail: ResponseDetail) => void;
  compact?: boolean;
}
```

Responsibilities:

- Fetches detail via `getResponseDetail` action when `selectedId` changes (copy fetch logic from dialog lines 89–106)
- Composes: `ResponseDetailHeader` + `ResponseDetailBody` + `ResponseDetailNav`
- Shows empty state when no response selected: centered muted text "Select a response to view details"
- Layout: `flex flex-col h-full`
- Add `aria-live="polite"` on the outer container so screen readers announce when the selected response changes
- Expose fetched `detail` via a callback prop `onDetailLoaded?: (detail: ResponseDetail) => void` — this allows the parent (`responses-tab`) to cache answers for the selected list item's preview

- [ ] **Step 5: Run type check**

Run: `pnpm test:types`
Expected: No type errors

- [ ] **Step 6: Commit**

```
feat: add response detail pane components
```

---

## Task 6: Refactor responses-tab to use split layout

**Files:**

- Modify: `src/features/surveys/components/stats/responses-tab.tsx`

Replace the table/dialog/card-based UI with the master-detail split.

- [ ] **Step 1: Replace the component body**

Remove imports: `ResponseCardRow`, `ResponseDetailDialog`, `ResponsesTable`
Add imports: `ResponseListPane`, `ResponseDetailPane`

State changes:

- Remove `detailOpen` state — detail is always visible on desktop
- Keep `selectedResponse` state
- Remove `handleRowClick` that opens dialog — replace with `handleSelect` that just sets selected response
- Remove `handleSortByColumn` callback — no longer needed (table with sortable columns is gone; sorting handled by toolbar)
- Add `cachedAnswers` state: `useState<Record<string, ResponseAnswer[]>>({})` — populated by `onDetailLoaded` callback from detail pane
- Add `showMobileDetail` state for mobile navigation

Focus management: when `selectedResponse` changes on desktop, shift focus to the detail pane header using a ref (`detailRef.current?.focus()`). Add `tabIndex={-1}` and `outline-none` on the detail pane container.

Layout (desktop md+):

```tsx
<div className="space-y-4">
  <ResponsesToolbar ... />

  <div className="border-border/50 overflow-hidden rounded-lg border md:flex md:h-[600px]">
    <ResponseListPane
      items={items}
      totalCount={totalCount}
      selectedId={selectedResponse?.id ?? null}
      isLoading={showLoading}
      hasLoaded={hasLoaded}
      startIndex={startIndex}
      cachedAnswers={cachedAnswers}
      onSelect={handleSelect}
    />
    {/* Desktop only: detail pane */}
    <div className="hidden flex-1 md:flex" ref={detailRef} tabIndex={-1} className="outline-none">
      <ResponseDetailPane
        selectedId={selectedResponse?.id ?? null}
        selectedMeta={selectedResponse}
        selectedIndex={currentIndex}
        totalItems={items.length}
        canNavigatePrev={currentIndex > 0}
        canNavigateNext={currentIndex < items.length - 1}
        onNavigate={handleNavigate}
        onDetailLoaded={handleDetailLoaded}
      />
    </div>
  </div>

  <ListPagination ... />
</div>
```

Mobile (<md): `ResponseListPane` at full width. Tapping an item navigates to a mobile detail view. Use a local state `showMobileDetail` boolean — when true, render `ResponseDetailPane` full-screen with a back button header that sets `showMobileDetail = false`.

Mobile detail wrapper:

```tsx
{!isMd && showMobileDetail && selectedResponse && (
  <div className="fixed inset-0 z-50 bg-background flex flex-col">
    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
      <Button variant="ghost" size="icon-sm" onClick={() => setShowMobileDetail(false)}>
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-sm font-semibold">Response #{startIndex + currentIndex + 1}</span>
    </div>
    <div className="flex-1 overflow-hidden">
      <ResponseDetailPane
        ...
        compact
        onDetailLoaded={handleDetailLoaded}
      />
    </div>
  </div>
)}
```

- [ ] **Step 2: Auto-select first response + detail caching**

When items load and no response is selected, auto-select the first item:

```tsx
useEffect(() => {
  if (items.length > 0 && !selectedResponse) {
    setSelectedResponse(items[0] ?? null);
  }
}, [items, selectedResponse]);
```

This ensures the detail pane shows content immediately on desktop.

Add the `handleDetailLoaded` callback that caches answers for list item previews:

```tsx
const [cachedAnswers, setCachedAnswers] = useState<Record<string, ResponseAnswer[]>>({});

const handleDetailLoaded = useCallback((detail: ResponseDetail) => {
  setCachedAnswers((prev) => ({ ...prev, [detail.id]: detail.answers }));
}, []);
```

Clear cache when `items` changes (new page/filter) to prevent stale data.

- [ ] **Step 3: Run type check**

Run: `pnpm test:types`
Expected: No type errors

- [ ] **Step 4: Manual verification**

Run: `pnpm dev`

Verify:

- Desktop: split layout renders, clicking list items updates detail pane
- Mobile: list view shows, tapping item opens full-screen detail, back button returns to list
- Filters/search/sort/pagination still work
- Keyboard navigation (arrow keys) works in detail pane
- Empty states show correctly (no responses, filtered to zero)
- Loading skeletons display during data fetch

- [ ] **Step 5: Commit**

```
feat: refactor responses tab to master-detail split layout
```

---

## Task 7: Delete old components

**Files:**

- Delete: `src/features/surveys/components/stats/responses-table.tsx`
- Delete: `src/features/surveys/components/stats/response-card-row.tsx`
- Delete: `src/features/surveys/components/stats/response-detail-dialog.tsx`

- [ ] **Step 1: Verify no remaining imports**

Search the codebase for any imports of the three components being deleted:

```bash
grep -r "ResponsesTable\|ResponseCardRow\|ResponseDetailDialog" src/ --include="*.tsx" --include="*.ts"
```

Expected: No matches (all replaced in Task 6)

- [ ] **Step 2: Delete the files**

Remove the three files.

- [ ] **Step 3: Run build to verify**

Run: `pnpm build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Run all tests**

Run: `pnpm test:unit`
Expected: All tests pass (no tests existed for these components; only lib/hooks/actions require tests per convention)

- [ ] **Step 5: Commit**

```
refactor: remove replaced response table, card, and dialog components
```

---

## Task 8: Run knip and final checks

- [ ] **Step 1: Check for unused exports**

Run: `pnpm knip`
Expected: No new unused exports introduced

- [ ] **Step 2: Run full lint + type check + tests**

Run: `pnpm lint && pnpm test:types && pnpm test:unit`
Expected: All pass

- [ ] **Step 3: Final commit if any cleanup needed**

```
fix: cleanup unused imports and exports
```
