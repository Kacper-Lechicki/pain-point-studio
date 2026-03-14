'use client';

import { getProject } from '@/features/projects/actions/get-project';
import type { ProjectDetail } from '@/features/projects/actions/get-project';
import type { ProjectWithMetrics } from '@/features/projects/types';
import { useItemSelection } from '@/hooks/common/use-item-selection';

export function useProjectSelection(projects: ProjectWithMetrics[]) {
  const fetchDetail = (id: string) => getProject(id);

  const { selectedId, selectedItem, detailData, showSheet, setSelected } = useItemSelection<
    ProjectWithMetrics,
    ProjectDetail
  >({ items: projects, fetchDetail });

  return {
    selectedId,
    selectedProject: selectedItem,
    projectDetail: detailData,
    showSheet,
    setSelected,
  };
}
