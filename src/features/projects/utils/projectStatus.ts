import type { ProjectStatus } from '../types.ts'

// Display labels for each project status.
// Record<ProjectStatus, string> means: one string for EVERY status, so
// TypeScript complains if we ever add a status and forget its label.
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
}
