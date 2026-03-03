/**
 * Shared form control size definitions.
 *
 * Every form control component (Button, Input, Select, Textarea, etc.)
 * should import these values for its cva `size` variants so that the
 * default height is consistent across the entire UI.
 *
 * After running `shadcn add <component>`, wire up the size variants
 * using FORM_CONTROL_SIZES and set `defaultVariants.size` to 'default'.
 */
export const FORM_CONTROL_SIZES = {
  default: 'h-10 md:h-9',
  md: 'h-9',
  sm: 'h-8',
} as const;
