import { api } from './api.ts'
import type { Project } from '../features/projects/types.ts'

// The project endpoints, added to the one shared api (see api.ts for why
// there's only one). They work exactly like the ticket ones: same base URL,
// same cache, same loading and error flags.

// A cache tag for projects, like TicketTag in ticketsApi.ts.
type ProjectTag = { type: 'Project'; id: number | 'LIST' }

const LIST_TAG: ProjectTag = { type: 'Project', id: 'LIST' }

export const projectsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => '/projects',
      // Nothing changes projects yet, so nothing invalidates these tags.
      // They're here so a future "edit project" mutation only has to say
      // which tags it invalidates, the same way the ticket mutations do.
      providesTags: (result) =>
        result
          ? [...result.map((project): ProjectTag => ({ type: 'Project', id: project.id })), LIST_TAG]
          : [LIST_TAG],
    }),

    getProject: builder.query<Project, number>({
      query: (id) => `/projects/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Project', id }],
    }),
  }),
})

export const { useGetProjectsQuery, useGetProjectQuery } = projectsApi
