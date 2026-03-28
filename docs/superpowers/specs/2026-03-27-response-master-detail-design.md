# Survey Responses — Master-Detail Split Redesign

## Problem

Current survey responses UI uses a table list + modal for details. The table is generic and uninformative, the modal breaks context and looks unprofessional.

## Solution

Replace table + modal with a master-detail split layout. Answer presentation matches the existing Questions tab visual language (ring charts, bar distributions, same color palette, Lucide icons).

## Layout

### Desktop (md+)

Two-pane split within the Responses tab:

- **Left pane (~340px):** Scrollable response list as compact cards
- **Right pane (flex-1):** Fixed detail panel showing selected response

### Mobile (<md)

Stacked navigation:

- **List view:** Full-width response cards — tap to navigate
- **Detail view:** Full-screen detail with back button in header

## Left Pane — Response List

Each list item contains:

- **Row 1:** `#index` + status badge (completed/in_progress/abandoned)
- **Row 2:** Meta — relative time, device (Lucide icon + label), duration (clock icon + value), separated by `·`
- **Row 3:** Labeled answer previews — truncated question text → answer value
  - Yes/No: green "Yes" / red "No"
  - Rating: "5 / 8" format
  - Text: truncated with ellipsis
  - Skipped: italic muted "skipped"

Active item: 2px left border in primary blue + subtle blue bg tint.

Header: response count + sort control ("Newest first").

## Right Pane — Response Detail

### Header

- Title: "Response #N" + status badge
- Meta row: full date, device icon + name, clock icon + duration

### Body — Question Cards

Each answer displayed in a `q-card` matching the Questions tab card style:

- **Question text:** numbered, semibold — e.g. "1. Do you like pizza?"
- **Type badge:** secondary badge with Lucide icon + type label
- **Answer visualization by type:**

| Type            | Visualization                                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Yes/No          | 48px ring chart (full green or red) + check/x icon in center + colored label                                                                                                                                 |
| Rating          | 48px ring chart (color by sentiment) + avg/max + sentiment label + 100px-tall bar distribution with count labels above each bar. Bar colors: red (low), amber (mid), green (high). Empty bars at 15% opacity |
| Short Text      | Muted bg box (`bg-muted`, `border-border`), pre-wrap, 13px                                                                                                                                                   |
| Multiple Choice | Horizontal bar chart — top option full cyan, others 30% opacity. Label + count + percentage per row                                                                                                          |
| Skipped         | Italic muted placeholder text                                                                                                                                                                                |

### Footer

- Prev/Next navigation buttons with response index
- Counter: "N of Total"
- Keyboard: left/right arrow keys

## Mobile Detail View

- Header: back chevron + "Response #N" + status badge
- Meta row below header
- Same q-cards but more compact (smaller padding, simplified — e.g. rating shows value + sentiment without bar chart)

## Components to Create/Modify

### Remove

- `response-detail-dialog.tsx` — replaced by detail pane
- `responses-table.tsx` — replaced by list pane
- `response-card-row.tsx` — replaced by unified list items

### Create

- `response-list-pane.tsx` — left pane with scrollable list items
- `response-list-item.tsx` — individual list card with answer previews
- `response-detail-pane.tsx` — right pane orchestrator
- `response-detail-header.tsx` — header with meta
- `response-detail-body.tsx` — scrollable question cards
- `response-detail-nav.tsx` — prev/next footer

### Modify

- `responses-tab.tsx` — replace table/dialog orchestration with split layout
- `response-answer-display.tsx` — extend with chart visualizations (ring, bars) matching Questions tab

## Data Layer

No changes needed:

- `useResponseList` hook — same filter/pagination state
- `getSurveyResponses` action — same list data
- `getResponseDetail` action — same detail fetch
- `ResponseDetail` / `ResponseAnswer` types — unchanged

## Toolbar

Existing `responses-toolbar.tsx` stays as-is above the split layout. No changes to search, filters, sort, or date range.

## Responsive Behavior

| Breakpoint   | Behavior                                                                     |
| ------------ | ---------------------------------------------------------------------------- |
| < md (768px) | List-only view. Tap → detail view (separate "page" with back nav). No split. |
| >= md        | Side-by-side split. List scrolls independently. Detail updates on selection. |

## Accessibility

- Arrow key navigation between responses (existing, preserved)
- Focus management on list item selection
- Skip-to-content compatible
- `aria-live="polite"` on detail pane for screen reader updates when selection changes

## Design Tokens

All colors, radii, shadows, and typography from existing design system — no new tokens introduced. Chart colors reuse the Questions tab palette (emerald, rose, amber, cyan).
