import { skipToken } from '@reduxjs/toolkit/query/react'
import { useParams } from 'react-router-dom'
import BackLink from '../components/BackLink.tsx'
import PageHeader from '../components/PageHeader.tsx'
import SkeletonGroup from '../components/SkeletonGroup.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import ProjectDetails from '../features/projects/components/ProjectDetails.tsx'
import ProjectDetailsSkeleton from '../features/projects/components/ProjectDetailsSkeleton.tsx'
import { isNotFoundError } from '../store/api.ts'
import { useGetProjectQuery } from '../store/projectsApi.ts'
import { parseId } from '../utils/parseId.ts'

// Shows one project, chosen by the :id part of the URL, e.g. /projects/3.
// It's the page that uses GET /api/v1/projects/:id, and it follows the same
// pattern as TicketDetailPage.
function ProjectDetailPage() {
  const { id } = useParams()
  // A number, or undefined if the URL holds something like "abc".
  const projectId = parseId(id)
  // skipToken: don't ask the server about an id that isn't a number.
  const {
    data: project,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetProjectQuery(projectId ?? skipToken)

  // Not a number, or the server said 404: there's no such project.
  if (projectId === undefined || isNotFoundError(error)) {
    return (
      <>
        <BackLink to="/projects">Back to projects</BackLink>
        <PageHeader
          title="Project not found"
          description={`There is no project with the id "${id}". The link may be wrong.`}
        />
      </>
    )
  }

  // While loading or after an error there's no name yet, so the heading
  // shows the project number instead. Every state has exactly one <h1>.
  if (isLoading) {
    return (
      <>
        <BackLink to="/projects">Back to projects</BackLink>
        <PageHeader title={`Project #${projectId}`} description="Loading the project…" />
        <SkeletonGroup label="Loading the project">
          <ProjectDetailsSkeleton />
        </SkeletonGroup>
      </>
    )
  }

  if (isError || !project) {
    return (
      <>
        <BackLink to="/projects">Back to projects</BackLink>
        <PageHeader title={`Project #${projectId}`} />
        <StatusMessage type="error" onRetry={refetch}>
          Sorry, we couldn't load this project.
        </StatusMessage>
      </>
    )
  }

  return (
    <>
      <BackLink to="/projects">Back to projects</BackLink>
      <PageHeader title={project.name} description={`Project #${project.id}`} />
      <ProjectDetails project={project} />
    </>
  )
}

export default ProjectDetailPage
