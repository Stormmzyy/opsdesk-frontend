import { projects as sampleProjects } from '../data/projects.ts'
import type { Project } from '../features/projects/types.ts'

// The mock API's project "database". Only the MSW handlers use this file,
// just like ticketDb.ts: the app itself asks /api/v1/projects for projects.
//
// src/data/projects.ts is the seed data, the same way src/data/tickets.ts
// seeds the tickets. Unlike tickets, nothing can create, change or delete a
// project yet, so there's nothing to save: no localStorage needed. If a
// project endpoint that writes is ever added, copy the load/persist pattern
// from ticketDb.ts.
export function getAllProjects(): Project[] {
  return sampleProjects
}
