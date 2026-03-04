'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-6 antialiased">
        <AlertTriangle className="text-destructive size-12" />

        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred. Please try again.
          </p>
        </div>

        <button
          type="button"
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
        >
          <RotateCcw className="size-4" />
          Try again
        </button>
      </body>
    </html>
  );
}
