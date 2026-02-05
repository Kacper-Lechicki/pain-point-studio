import { AuthHeader } from '@/features/auth/components/auth-header';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { UpdatePasswordForm } from '@/features/auth/components/update-password-form';

export default function UpdatePasswordPage() {
  return (
    <AuthLayout>
      <AuthHeader title="Set New Password" description="Please enter your new password below" />
      <UpdatePasswordForm />
    </AuthLayout>
  );
}
