/**
 * Provider-agnostic admin auth interface for privileged operations that
 * bypass normal user-level auth (e.g. hard-deleting a user).
 */

export interface AuthAdminError {
  message: string;
}

export interface AuthAdminProvider {
  deleteUser(userId: string): Promise<{ error: AuthAdminError | null }>;
  updateUserById(
    userId: string,
    data: { email?: string }
  ): Promise<{ error: AuthAdminError | null }>;
}
