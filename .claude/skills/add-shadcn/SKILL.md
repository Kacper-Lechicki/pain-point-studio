---
name: add-shadcn
description: Add a shadcn/ui component and apply project sizing conventions
argument-hint: '<component-name>'
allowed-tools: 'Bash, Read, Edit, Glob'
---

# Add shadcn/ui Component

Install a shadcn/ui component and apply project conventions.

## Steps

1. Run `pnpm dlx shadcn@latest add $ARGUMENTS` to install the component
2. Find the newly created/updated file(s) in `src/components/ui/`
3. Read the component file
4. Import `FORM_CONTROL_SIZES` from `@/components/ui/form-variants`
5. Update the default size variant to use `FORM_CONTROL_SIZES.default` (responsive: h-10 mobile → md:h-9 desktop)
6. Verify the component follows project conventions
7. Report what was installed and what was modified
