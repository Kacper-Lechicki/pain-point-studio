import { AuthHeader } from '@/features/auth/components/auth-header';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthHeader
        title="Reset Password"
        description="Enter your email to receive a password reset link"
      />

      <ForgotPasswordForm />
    </AuthLayout>
  );
}
