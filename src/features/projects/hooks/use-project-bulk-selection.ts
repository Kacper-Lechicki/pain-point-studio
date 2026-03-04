'use client';

import { useState } from 'react';

import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import type { ProjectAction } from '@/features/projects/config/status';
import { getAvailableActions } from '@/features/projects/config/status';
import type { ProjectStatus } from '@/features/projects/types';

export function useProjectBulkSelection(projects: ProjectWithMetrics[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const selectAll = (filteredProjects: ProjectWithMetrics[]) => {
    setSelectedIds(new Set(filteredProjects.map((p) => p.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  /** Actions available for ALL selected projects (intersection). */
  const availableBulkActions = (() => {
    if (selectedIds.size === 0) {
      return [];
    }

    const selectedProjects = projects.filter((p) => selectedIds.has(p.id));

    if (selectedProjects.length === 0) {
      return [];
    }

    // Start with the first project's available actions and intersect
    const first = selectedProjects[0];

    if (!first) {
      return [];
    }

    let commonActions: Set<ProjectAction> = new Set(
      getAvailableActions(first.status as ProjectStatus)
    );

    for (let i = 1; i < selectedProjects.length; i++) {
      const project = selectedProjects[i];

      if (!project) {
        continue;
      }

      const projectActions = new Set(getAvailableActions(project.status as ProjectStatus));
      commonActions = new Set([...commonActions].filter((a) => projectActions.has(a)));
    }

    // Exclude permanentDelete from bulk operations for safety
    commonActions.delete('permanentDelete');

    return [...commonActions];
  })();

  return {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    availableBulkActions,
    selectionCount: selectedIds.size,
  };
}
