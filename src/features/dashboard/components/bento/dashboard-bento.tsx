import type { OverviewProject } from '@/features/dashboard/actions/get-dashboard-overview';
import type { DashboardStats } from '@/features/dashboard/types/dashboard-stats';
import type { ProjectDetail } from '@/features/projects/actions/get-project';

import { CompletionOverTimeCard } from './completion-over-time-card';
import { DashboardGreeting } from './dashboard-greeting';
import { DashboardKpiCards } from './dashboard-kpi-cards';
import { DashboardProjectsList } from './dashboard-projects-list';
import { DashboardRecentActivity } from './dashboard-recent-activity';
import { DashboardTimeFilter } from './dashboard-time-filter';
import { PinnedProjectCard } from './pinned-project-card';
import { PinnedProjectEmpty } from './pinned-project-empty';
import { ResponsesChart } from './responses-chart';

// ── Props ───────────────────────────────────────────────────────────

interface DashboardBentoProps {
  fullName: string;
  stats: DashboardStats | null;
  projects: OverviewProject[];
  pinnedProject: ProjectDetail | null;
  pinnedProjectId: string | null;
  currentPeriod: string;
}

// ── Component ───────────────────────────────────────────────────────

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
      {/* ── Row 1: Greeting + Filter ─────────────────────────── */}
      <div className="col-span-full flex flex-wrap items-center justify-between gap-3">
        <DashboardGreeting fullName={fullName} />
        <DashboardTimeFilter currentPeriod={currentPeriod} />
      </div>

      {/* ── Row 2: KPI Cards ─────────────────────────────────── */}
      <div className="col-span-full">
        <DashboardKpiCards stats={stats} projectCount={projects.length} periodDays={periodDays} />
      </div>

      {/* ── Row 3: Responses over time | Form entries over time (violet) | Recent activity ─────────── */}
      <div className="h-full min-h-0">
        <ResponsesChart data={stats?.responsesTimeline ?? []} />
      </div>
      <CompletionOverTimeCard data={stats?.completionTimeline ?? []} className="h-full min-h-0" />
      <DashboardRecentActivity items={stats?.recentActivity ?? []} />

      {/* ── Row 4: Pinned Project + Projects List ────────────────────────────────────────────────── */}
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
