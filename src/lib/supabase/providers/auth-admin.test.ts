/** Tests for the Supabase AuthAdmin provider that uses service role for privileged operations. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSupabaseAuthAdmin } from './auth-admin';

// ── Mock admin client ────────────────────────────────────────────

const mockDeleteUser = vi.fn();
const mockUpdateUserById = vi.fn();

vi.mock('../admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        deleteUser: mockDeleteUser,
        updateUserById: mockUpdateUserById,
      },
    },
  }),
}));

describe('createSupabaseAuthAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteUser', () => {
    it('should call admin.auth.admin.deleteUser and return null error on success', async () => {
      mockDeleteUser.mockResolvedValue({ error: null });

      const admin = createSupabaseAuthAdmin();
      const result = await admin.deleteUser('user-123');

      expect(mockDeleteUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ error: null });
    });

    it('should map error when delete fails', async () => {
      mockDeleteUser.mockResolvedValue({
        error: { message: 'User not found' },
      });

      const admin = createSupabaseAuthAdmin();
      const result = await admin.deleteUser('nonexistent');

      expect(result).toEqual({ error: { message: 'User not found' } });
    });
  });

  describe('updateUserById', () => {
    it('should call admin.auth.admin.updateUserById and return null error on success', async () => {
      mockUpdateUserById.mockResolvedValue({ error: null });

      const admin = createSupabaseAuthAdmin();
      const result = await admin.updateUserById('user-123', {
        email: 'new@example.com',
      });

      expect(mockUpdateUserById).toHaveBeenCalledWith('user-123', {
        email: 'new@example.com',
      });
      expect(result).toEqual({ error: null });
    });

    it('should map error when update fails', async () => {
      mockUpdateUserById.mockResolvedValue({
        error: { message: 'Email already in use' },
      });

      const admin = createSupabaseAuthAdmin();
      const result = await admin.updateUserById('user-123', {
        email: 'taken@example.com',
      });

      expect(result).toEqual({ error: { message: 'Email already in use' } });
    });
  });
});
