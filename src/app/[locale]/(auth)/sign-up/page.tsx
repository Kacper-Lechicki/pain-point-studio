import { ROUTES } from '@/config/routes';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';
import { SignUpForm } from '@/features/auth/components/sign-up-form';

export default function SignUpPage() {
  return (
    <AuthLayout>
      <AuthHeader
        title="Create an account"
        description="Enter your email below to create your account"
        linkText="Sign In"
        linkHref={ROUTES.auth.signIn}
      />

      <div className="grid gap-6">
        <SignUpForm />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>

          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background text-muted-foreground px-2">Or continue with</span>
          </div>
        </div>

        <OAuthButtons />
      </div>

      <p className="text-muted-foreground px-8 text-center text-sm">
        By clicking continue, you agree to our{' '}
        <span className="hover:text-primary underline underline-offset-4">Terms of Service</span>{' '}
        and <span className="hover:text-primary underline underline-offset-4">Privacy Policy</span>.
      </p>
    </AuthLayout>
  );
}
