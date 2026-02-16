import { describe, expect, it } from 'vitest';

import {
  changePasswordSchema,
  completeProfileSchema,
  deleteAccountSchema,
  setPasswordSchema,
  socialLinkSchema,
  unlinkIdentitySchema,
  updateEmailSchema,
  updateProfileSchema,
} from '.';

// ── socialLinkSchema ────────────────────────────────────────────────

describe('socialLinkSchema', () => {
  it('accepts a valid website link', () => {
    const result = socialLinkSchema.safeParse({
      label: 'website',
      url: 'https://example.com',
    });

    expect(result.success).toBe(true);
  });

  it('accepts a valid github link', () => {
    const result = socialLinkSchema.safeParse({
      label: 'github',
      url: 'https://github.com/user',
    });

    expect(result.success).toBe(true);
  });

  it('accepts github link with www prefix', () => {
    const result = socialLinkSchema.safeParse({
      label: 'github',
      url: 'https://www.github.com/user',
    });

    expect(result.success).toBe(true);
  });

  it('rejects github label with non-github domain', () => {
    const result = socialLinkSchema.safeParse({
      label: 'github',
      url: 'https://twitter.com/user',
    });

    expect(result.success).toBe(false);
  });

  it('accepts twitter label with x.com', () => {
    const result = socialLinkSchema.safeParse({
      label: 'twitter',
      url: 'https://x.com/user',
    });

    expect(result.success).toBe(true);
  });

  it('accepts twitter label with twitter.com', () => {
    const result = socialLinkSchema.safeParse({
      label: 'twitter',
      url: 'https://twitter.com/user',
    });

    expect(result.success).toBe(true);
  });

  it('rejects twitter label with non-twitter domain', () => {
    const result = socialLinkSchema.safeParse({
      label: 'twitter',
      url: 'https://linkedin.com/in/user',
    });

    expect(result.success).toBe(false);
  });

  it('accepts linkedin label with linkedin.com', () => {
    const result = socialLinkSchema.safeParse({
      label: 'linkedin',
      url: 'https://linkedin.com/in/user',
    });

    expect(result.success).toBe(true);
  });

  it('rejects linkedin label with non-linkedin domain', () => {
    const result = socialLinkSchema.safeParse({
      label: 'linkedin',
      url: 'https://github.com/user',
    });

    expect(result.success).toBe(false);
  });

  it('allows any domain for "other" label', () => {
    const result = socialLinkSchema.safeParse({
      label: 'other',
      url: 'https://my-portfolio.dev',
    });

    expect(result.success).toBe(true);
  });

  it('allows any domain for "website" label', () => {
    const result = socialLinkSchema.safeParse({
      label: 'website',
      url: 'https://any-domain.org/page',
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty label', () => {
    const result = socialLinkSchema.safeParse({
      label: '',
      url: 'https://example.com',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid URL', () => {
    const result = socialLinkSchema.safeParse({
      label: 'website',
      url: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });

  it('accepts github subdomain', () => {
    const result = socialLinkSchema.safeParse({
      label: 'github',
      url: 'https://subdomain.github.com/org',
    });

    expect(result.success).toBe(true);
  });
});

// ── completeProfileSchema ───────────────────────────────────────────

describe('completeProfileSchema', () => {
  it('accepts valid data', () => {
    const result = completeProfileSchema.safeParse({
      fullName: 'John Doe',
      role: 'designer',
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty fullName', () => {
    const result = completeProfileSchema.safeParse({
      fullName: '',
      role: 'designer',
    });

    expect(result.success).toBe(false);
  });

  it('rejects fullName exceeding 100 characters', () => {
    const result = completeProfileSchema.safeParse({
      fullName: 'a'.repeat(101),
      role: 'designer',
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty role', () => {
    const result = completeProfileSchema.safeParse({
      fullName: 'John',
      role: '',
    });

    expect(result.success).toBe(false);
  });
});

// ── updateProfileSchema ─────────────────────────────────────────────

describe('updateProfileSchema', () => {
  it('accepts valid data with social links', () => {
    const result = updateProfileSchema.safeParse({
      fullName: 'Jane',
      role: 'founder',
      bio: 'Short bio',
      socialLinks: [{ label: 'website', url: 'https://example.com' }],
    });

    expect(result.success).toBe(true);
  });

  it('rejects bio exceeding 200 characters', () => {
    const result = updateProfileSchema.safeParse({
      fullName: 'Jane',
      role: 'founder',
      bio: 'a'.repeat(201),
      socialLinks: [],
    });

    expect(result.success).toBe(false);
  });

  it('rejects more than 5 social links', () => {
    const links = Array.from({ length: 6 }, (_, i) => ({
      label: 'website',
      url: `https://example${i}.com`,
    }));

    const result = updateProfileSchema.safeParse({
      fullName: 'Jane',
      role: 'founder',
      bio: '',
      socialLinks: links,
    });

    expect(result.success).toBe(false);
  });
});

// ── updateEmailSchema ───────────────────────────────────────────────

describe('updateEmailSchema', () => {
  it('accepts valid email', () => {
    const result = updateEmailSchema.safeParse({ email: 'test@example.com' });

    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = updateEmailSchema.safeParse({ email: 'not-an-email' });

    expect(result.success).toBe(false);
  });
});

// ── changePasswordSchema ────────────────────────────────────────────

describe('changePasswordSchema', () => {
  it('rejects mismatched passwords', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1!',
      password: 'NewPass1!',
      confirmPassword: 'DifferentPass1!',
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      password: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    });

    expect(result.success).toBe(false);
  });
});

// ── setPasswordSchema ───────────────────────────────────────────────

describe('setPasswordSchema', () => {
  it('rejects mismatched passwords', () => {
    const result = setPasswordSchema.safeParse({
      password: 'NewPass1!',
      confirmPassword: 'DifferentPass1!',
    });

    expect(result.success).toBe(false);
  });
});

// ── unlinkIdentitySchema ────────────────────────────────────────────

describe('unlinkIdentitySchema', () => {
  it('accepts valid data', () => {
    const result = unlinkIdentitySchema.safeParse({
      identityId: 'id-123',
      provider: 'google',
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty identityId', () => {
    const result = unlinkIdentitySchema.safeParse({
      identityId: '',
      provider: 'google',
    });

    expect(result.success).toBe(false);
  });
});

// ── deleteAccountSchema ─────────────────────────────────────────────

describe('deleteAccountSchema', () => {
  it('accepts valid email confirmation', () => {
    const result = deleteAccountSchema.safeParse({
      confirmation: 'user@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('rejects non-email confirmation', () => {
    const result = deleteAccountSchema.safeParse({
      confirmation: 'not-an-email',
    });

    expect(result.success).toBe(false);
  });
});
