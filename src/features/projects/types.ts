// Types for the projects feature.

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'

export interface Project {
  id: number
  name: string
  description: string
  status: ProjectStatus
  team: string
  // The name of the employee leading the project.
  lead: string
}
