'use client';

import { Button } from '@/components/ui/button';

export function YesNoEditor() {
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" disabled className="flex-1 opacity-60">
        Yes
      </Button>
      <Button variant="outline" disabled className="flex-1 opacity-60">
        No
      </Button>
    </div>
  );
}
