import { z } from 'zod';

import { basePasswordSchema } from '@/features/auth/config/password';
import { BIO_MAX_LENGTH, FULL_NAME_MAX_LENGTH, MAX_SOCIAL_LINKS } from '@/features/settings/config';
import { SOCIAL_LINK_DOMAINS } from '@/features/settings/config/social-link-types';

// ── Validation schemas ──────────────────────────────────────────────

/** Social link with label and URL; enforces provider-specific domain matching. */
export const socialLinkSchema = z
  .object({
    label: z.string().min(1, 'settings.errors.fieldRequired'),
    url: z.string().url('settings.errors.invalidUrl'),
  })
  .refine(
    (data) => {
      const allowedDomains = SOCIAL_LINK_DOMAINS[data.label];

      if (!allowedDomains) {
        return true;
      }

      try {
        const hostname = new URL(data.url).hostname.replace(/^www\./, '');

        return allowedDomains.some(
          (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
        );
      } catch {
        return false;
      }
    },
    { message: 'settings.errors.socialLinkDomainMismatch', path: ['url'] }
  );

export type SocialLink = z.infer<typeof socialLinkSchema>;

/** Minimal profile data required during first-time onboarding. */
export const completeProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'settings.errors.fieldRequired')
    .max(FULL_NAME_MAX_LENGTH, 'settings.errors.nameTooLong'),
  role: z.string().min(1, 'settings.errors.fieldRequired'),
});

export type CompleteProfileSchema = z.infer<typeof completeProfileSchema>;

/** Full profile form: name, role, bio, and social links. */
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'settings.errors.fieldRequired')
    .max(FULL_NAME_MAX_LENGTH, 'settings.errors.nameTooLong'),
  role: z.string().min(1, 'settings.errors.fieldRequired'),
  bio: z.string().max(BIO_MAX_LENGTH, 'settings.errors.bioTooLong'),
  socialLinks: z.array(socialLinkSchema).max(MAX_SOCIAL_LINKS),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

/** Email change form: single email field. */
export const updateEmailSchema = z.object({
  email: z.email('settings.errors.invalidEmail'),
});

export type UpdateEmailSchema = z.infer<typeof updateEmailSchema>;

/** Password change form: current password + new password with confirmation. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'settings.errors.fieldRequired'),
    password: basePasswordSchema,
    confirmPassword: basePasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'settings.errors.passwordsMismatch',
    path: ['confirmPassword'],
  });

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

/** First-time password form for OAuth-only users (no current password needed). */
export const setPasswordSchema = z
  .object({
    password: basePasswordSchema,
    confirmPassword: basePasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'settings.errors.passwordsMismatch',
    path: ['confirmPassword'],
  });

export type SetPasswordSchema = z.infer<typeof setPasswordSchema>;

/** Payload for disconnecting an OAuth identity. */
export const unlinkIdentitySchema = z.object({
  identityId: z.string().min(1),
  provider: z.string().min(1),
});

/** Account deletion form: user must type their email to confirm. */
export const deleteAccountSchema = z.object({
  confirmation: z.string().email('settings.errors.confirmationMismatch'),
});

export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;
