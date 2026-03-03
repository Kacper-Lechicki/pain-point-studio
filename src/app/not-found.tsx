import Link from 'next/link';

import { ArrowLeft, FileQuestion } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <FileQuestion className="text-muted-foreground size-16" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>

      <Button variant="default" asChild>
        <Link href="/">
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  );
}
