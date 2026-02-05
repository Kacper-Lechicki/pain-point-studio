'use client';

import { useState } from 'react';

import { Github } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { signInWithOAuth } from '@/features/auth/actions';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.347.533 12S5.867 24 12.48 24c3.44 0 6.04-1.133 7.373-3.227 1.6-1.7 2.147-4.293 2.147-6.533 0-.613-.053-1.107-.127-1.32H12.48z"
        fill="currentColor"
      />
    </svg>
  );
}

export function OAuthButtons() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(provider);
    const result = await signInWithOAuth(provider);

    if (result.error) {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        onClick={() => handleOAuthSignIn('github')}
        disabled={loading !== null}
        className="w-full"
      >
        {loading === 'github' ? (
          <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Github className="mr-2 size-4" />
        )}
        GitHub
      </Button>

      <Button
        variant="outline"
        onClick={() => handleOAuthSignIn('google')}
        disabled={loading !== null}
        className="w-full"
      >
        {loading === 'google' ? (
          <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <GoogleIcon className="mr-2 size-4" />
        )}
        Google
      </Button>
    </div>
  );
}
