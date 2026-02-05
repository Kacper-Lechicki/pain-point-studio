'use client';

import { Button } from '@/components/ui/button';
import { signOut } from '@/features/auth/actions';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function SettingsPage() {
  const { user, loading } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-medium">Profile</h2>

        {loading ? (
          <div>Loading user data...</div>
        ) : user ? (
          <div className="space-y-4">
            <div>
              <label className="text-muted-foreground text-sm font-medium">Email</label>
              <div className="text-sm">{user.email}</div>
            </div>

            <div>
              <label className="text-muted-foreground text-sm font-medium">User ID</label>
              <div className="text-muted-foreground font-mono text-sm">{user.id}</div>
            </div>
          </div>
        ) : (
          <div>Not logged in</div>
        )}
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-medium">Account Actions</h2>

        <form
          action={async () => {
            await signOut();
          }}
        >
          <Button variant="destructive">Sign Out</Button>
        </form>
      </div>
    </div>
  );
}
