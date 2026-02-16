// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/common/env', () => ({
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

const mockUpdateUser = vi.fn();
const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockAdminUpdateUserById = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      updateUser: mockUpdateUser,
      getUser: mockGetUser,
    },
    rpc: mockRpc,
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    auth: { admin: { updateUserById: mockAdminUpdateUserById } },
  }),
}));

const changeData = {
  currentPassword: 'OldPass1!',
  password: 'NewSecurePass1!',
  confirmPassword: 'NewSecurePass1!',
};

const setData = {
  password: 'NewSecurePass1!',
  confirmPassword: 'NewSecurePass1!',
};

describe('Settings Actions – changePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'user@example.com', identities: [{ provider: 'email' }] } },
    });
    mockRpc.mockResolvedValue({ data: true });
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  // Valid current + new + confirm: verify_password RPC and updateUser called; success.
  it('should return success when password is changed', async () => {
    const { changePassword } = await import('./update-password');
    const result = await changePassword(changeData);

    expect(result).toEqual({ success: true });
    expect(mockRpc).toHaveBeenCalledWith('verify_password', {
      current_plain_password: changeData.currentPassword,
    });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: changeData.password,
    });
  });

  // Weak password fails validation; Supabase is not called.
  it('should not call Supabase when passwords are too weak', async () => {
    const { changePassword } = await import('./update-password');

    const result = await changePassword({
      currentPassword: 'OldPass1!',
      password: 'weak',
      confirmPassword: 'weak',
    });

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  // Mismatched password and confirmPassword fail validation; Supabase not called.
  it('should not call Supabase when passwords do not match', async () => {
    const { changePassword } = await import('./update-password');

    const result = await changePassword({
      currentPassword: 'OldPass1!',
      password: 'NewSecurePass1!',
      confirmPassword: 'DifferentPass1!',
    });

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  // When updateUser returns error, changePassword returns error result.
  it('should return error when Supabase rejects the update', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Password update failed' },
    });

    const { changePassword } = await import('./update-password');
    const result = await changePassword(changeData);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  // When rate limited, changePassword returns error and does not call Supabase.
  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { changePassword } = await import('./update-password');
    const result = await changePassword(changeData);

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  // verify_password returns false: action returns currentPasswordIncorrect, no updateUser.
  it('should reject when current password is incorrect', async () => {
    mockRpc.mockResolvedValue({ data: false });

    const { changePassword } = await import('./update-password');
    const result = await changePassword({
      currentPassword: 'WrongPass1!',
      password: 'NewSecurePass1!',
      confirmPassword: 'NewSecurePass1!',
    });

    expect(result.error).toBe('settings.errors.currentPasswordIncorrect');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  // When getUser returns null, action returns settings.errors.unexpected.
  it('should return unexpected error when getUser returns no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { changePassword } = await import('./update-password');
    const result = await changePassword(changeData);

    expect(result.error).toBe('settings.errors.unexpected');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});

describe('Settings Actions – setPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-id-123',
          email: 'user@example.com',
          identities: [{ provider: 'google', identity_id: 'g-123' }],
        },
      },
    });
    mockRpc.mockResolvedValue({ data: false });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockAdminUpdateUserById.mockResolvedValue({ error: null });
  });

  // OAuth-only user: has_password false, setPassword updates user and creates email identity.
  it('should return success and create email identity for OAuth-only user', async () => {
    const { setPassword } = await import('./update-password');
    const result = await setPassword(setData);

    expect(result).toEqual({ success: true });
    expect(mockRpc).toHaveBeenCalledWith('has_password');
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: setData.password });
    expect(mockAdminUpdateUserById).toHaveBeenCalledWith('user-id-123', {
      email: 'user@example.com',
    });
    expect(mockRpc).not.toHaveBeenCalledWith('verify_password', expect.anything());
  });

  // User already has email identity: adminUpdateUserById not called.
  it('should not create email identity if one already exists', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-id-123',
          email: 'user@example.com',
          identities: [
            { provider: 'google', identity_id: 'g-123' },
            { provider: 'email', identity_id: 'e-456' },
          ],
        },
      },
    });

    const { setPassword } = await import('./update-password');
    const result = await setPassword(setData);

    expect(result).toEqual({ success: true });
    expect(mockAdminUpdateUserById).not.toHaveBeenCalled();
  });

  // has_password returns true: action returns unexpected, updateUser not called.
  it('should reject when user already has a password', async () => {
    mockRpc.mockResolvedValue({ data: true });

    const { setPassword } = await import('./update-password');
    const result = await setPassword(setData);

    expect(result.error).toBe('settings.errors.unexpected');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  // Weak password fails validation; setPassword does not call Supabase.
  it('should not call Supabase when passwords are too weak', async () => {
    const { setPassword } = await import('./update-password');

    const result = await setPassword({
      password: 'weak',
      confirmPassword: 'weak',
    });

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  // Mismatched password/confirmPassword fail validation; Supabase not called.
  it('should not call Supabase when passwords do not match', async () => {
    const { setPassword } = await import('./update-password');

    const result = await setPassword({
      password: 'NewSecurePass1!',
      confirmPassword: 'DifferentPass1!',
    });

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  // When updateUser returns error, setPassword returns error result.
  it('should return error when Supabase rejects the update', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Password update failed' },
    });

    const { setPassword } = await import('./update-password');
    const result = await setPassword(setData);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  // When rate limited, setPassword returns error and does not call Supabase.
  it('should return rate limit error when rate limited', async () => {
    const { rateLimit } = await import('@/lib/common/rate-limit');

    vi.mocked(rateLimit).mockResolvedValueOnce({ limited: true });

    const { setPassword } = await import('./update-password');
    const result = await setPassword(setData);

    expect(result.error).toBeDefined();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});
