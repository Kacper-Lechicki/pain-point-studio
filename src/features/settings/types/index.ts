import { z } from 'zod';

import { basePasswordSchema } from '@/features/auth/config/password';
import { BIO_MAX_LENGTH, FULL_NAME_MAX_LENGTH, MAX_SOCIAL_LINKS } from '@/features/settings/config';

const SOCIAL_LINK_DOMAINS: Record<string, string[]> = {
  github: ['github.com'],
  twitter: ['twitter.com', 'x.com'],
  linkedin: ['linkedin.com'],
};

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

export const completeProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'settings.errors.fieldRequired')
    .max(FULL_NAME_MAX_LENGTH, 'settings.errors.nameTooLong'),
  role: z.string().min(1, 'settings.errors.fieldRequired'),
});

export type CompleteProfileSchema = z.infer<typeof completeProfileSchema>;

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

export const updateEmailSchema = z.object({
  email: z.email('settings.errors.invalidEmail'),
});

export type UpdateEmailSchema = z.infer<typeof updateEmailSchema>;

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'settings.errors.fieldRequired'),
    password: basePasswordSchema,
    confirmPassword: basePasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'settings.errors.passwordsMismatch',
    path: ['confirmPassword'],
  });

export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;

export const deleteAccountSchema = z.object({
  confirmation: z.string().email('settings.errors.confirmationMismatch'),
});

export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;
