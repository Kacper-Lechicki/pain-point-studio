import { useEffect, useRef, useState } from 'react';

import { getProjects } from '@/features/projects/actions/get-projects';
import type { ProjectWithMetrics } from '@/features/projects/types';
import { getUserSurveys } from '@/features/surveys/actions/get-user-surveys';
import type { UserSurvey } from '@/features/surveys/types';
import { usePathname } from '@/i18n/routing';

export function useCommandPaletteData(open: boolean) {
  const [projects, setProjects] = useState<ProjectWithMetrics[] | null>(null);
  const [surveys, setSurveys] = useState<UserSurvey[] | null>(null);
  const [loading, setLoading] = useState(false);

  const pathname = usePathname();
  const lastPathname = useRef(pathname);

  // Invalidate cache when pathname changes
  if (pathname !== lastPathname.current) {
    lastPathname.current = pathname;
    setProjects(null);
    setSurveys(null);
  }

  useEffect(() => {
    if (!open || (projects !== null && surveys !== null)) {
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      try {
        const [projectsData, surveysData] = await Promise.all([getProjects(), getUserSurveys()]);

        if (!cancelled) {
          setProjects((projectsData ?? []).filter((p) => p.status !== 'trashed'));
          setSurveys(surveysData ?? []);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [open, projects, surveys]);

  return { projects, surveys, loading } as const;
}
