import { z } from 'zod';

import { basePasswordSchema } from '@/features/auth/config/password';
import { BIO_MAX_LENGTH, FULL_NAME_MAX_LENGTH, MAX_SOCIAL_LINKS } from '@/features/settings/config';

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

const SOCIAL_LINK_DOMAINS: Record<string, string[]> = {
  github: ['github.com'],
  twitter: ['twitter.com', 'x.com'],
  linkedin: ['linkedin.com'],
};

export const socialLinkSchema = z
  .object({
    label: z.string().min(1),
    url: z.string().url(),
  })
  .refine(
    (data) => {
      const allowedDomains = SOCIAL_LINK_DOMAINS[data.label];

      if (!allowedDomains) {return true;}

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

export const updateProfileSchema = z.object({
  fullName: z.string().max(FULL_NAME_MAX_LENGTH),
  role: z.string(),
  bio: z.string().max(BIO_MAX_LENGTH),
  socialLinks: z.array(socialLinkSchema).max(MAX_SOCIAL_LINKS),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

export const updateEmailSchema = z.object({
  email: z.email(),
});

export type UpdateEmailSchema = z.infer<typeof updateEmailSchema>;

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    password: basePasswordSchema,
    confirmPassword: basePasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'settings.errors.passwordsMismatch',
    path: ['confirmPassword'],
  });

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

// ---------------------------------------------------------------------------
// Delete account
// ---------------------------------------------------------------------------

export const deleteAccountSchema = z.object({
  confirmation: z.string().email(),
});

export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;
