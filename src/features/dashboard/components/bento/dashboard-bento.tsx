import { DashboardGreeting } from '@/features/dashboard/components/bento/dashboard-greeting';
import { DashboardKpiCards } from '@/features/dashboard/components/bento/dashboard-kpi-cards';
import { DashboardProjectsList } from '@/features/dashboard/components/bento/dashboard-projects-list';
import { DashboardRecentActivity } from '@/features/dashboard/components/bento/dashboard-recent-activity';
import { DashboardTimeFilter } from '@/features/dashboard/components/bento/dashboard-time-filter';
import { PinnedProjectCard } from '@/features/dashboard/components/bento/pinned-project-card';
import { PinnedProjectEmpty } from '@/features/dashboard/components/bento/pinned-project-empty';
import { ResponsesChart } from '@/features/dashboard/components/bento/responses-chart';
import type { OverviewProject } from '@/features/dashboard/types';
import type { DashboardStats } from '@/features/dashboard/types/dashboard-stats';
import type { ProjectDetail } from '@/features/projects/actions/get-project';

interface DashboardBentoProps {
  fullName: string;
  stats: DashboardStats | null;
  projects: OverviewProject[];
  pinnedProject: ProjectDetail | null;
  pinnedProjectId: string | null;
  currentPeriod: string;
}

export function DashboardBento({
  fullName,
  stats,
  projects,
  pinnedProject,
  pinnedProjectId,
  currentPeriod,
}: DashboardBentoProps) {
  const matchingOverviewProject = pinnedProject
    ? projects.find((p) => p.id === pinnedProject.project.id)
    : undefined;

  const hasPinned = pinnedProject && matchingOverviewProject;
  const periodDays = Number(currentPeriod) || 0;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
      <div className="col-span-full flex flex-wrap items-center justify-between gap-3">
        <DashboardGreeting fullName={fullName} />
        <DashboardTimeFilter currentPeriod={currentPeriod} />
      </div>

      <div className="col-span-full">
        <DashboardKpiCards stats={stats} projectCount={projects.length} periodDays={periodDays} />
      </div>

      <div className="h-full min-h-0 lg:col-span-2">
        <ResponsesChart data={stats?.responsesTimeline ?? []} />
      </div>
      <DashboardRecentActivity items={stats?.recentActivity ?? []} />

      <div className="lg:col-span-2">
        {hasPinned ? (
          <PinnedProjectCard project={pinnedProject} overviewProject={matchingOverviewProject} />
        ) : (
          <PinnedProjectEmpty />
        )}
      </div>
      <div className="lg:col-span-1">
        <DashboardProjectsList projects={projects} pinnedProjectId={pinnedProjectId} />
      </div>
    </section>
  );
}
