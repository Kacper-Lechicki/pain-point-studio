---
description: Form control sizing, shadcn/ui conventions, button icon sizes
paths:
  - 'src/components/**'
  - 'src/features/*/components/**'
---

# UI Component Rules

## Form Control Sizing

Default size is **responsive**: `h-10` (40px) on mobile → `md:h-9` (36px) on desktop.

- Shared definitions in `src/components/ui/form-variants.ts` (`FORM_CONTROL_SIZES`)
- Custom interactive elements (menu items, nav tabs, etc.) use `min-h-10 md:min-h-9`

### Button Icon Sizes

| Variant   | Size                |
| --------- | ------------------- |
| `icon`    | size-10 / md:size-9 |
| `icon-md` | size-9              |
| `icon-sm` | size-8              |
| `icon-xs` | size-6              |

## After `shadcn add <component>`

1. Import `FORM_CONTROL_SIZES` from `@/components/ui/form-variants`
2. Set default size variant to `FORM_CONTROL_SIZES.default`
3. Verify responsive sizing matches convention (h-10 → md:h-9)

## shadcn/ui Config

- Style: New York
- Icon library: Lucide React
- Aliases: `@/components`, `@/lib/common/utils`, `@/components/ui`
