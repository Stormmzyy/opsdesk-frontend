import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.tsx'
import SkeletonGroup from '../components/SkeletonGroup.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import ProjectList from '../features/projects/components/ProjectList.tsx'
import ProjectListSkeleton from '../features/projects/components/ProjectListSkeleton.tsx'
import { useGetProjectsQuery } from '../store/projectsApi.ts'

function ProjectsPage() {
  // Projects now come from the API (GET /api/v1/projects), like tickets do,
  // so this page has the same three states as the ticket pages.
  const { data: projects, isLoading, isError, refetch } = useGetProjectsQuery()

  return (
    <>
      <PageHeader title="Projects" description="What each team is working on right now." />

      {isLoading && (
        <SkeletonGroup label="Loading projects">
          <ProjectListSkeleton />
        </SkeletonGroup>
      )}

      {isError && (
        <StatusMessage type="error" onRetry={refetch}>
          Sorry, we couldn't load the projects.
        </StatusMessage>
      )}

      {/* There's no way to create a project in OpsDesk yet, so the way out
          points at the work that does exist: the tickets. */}
      {projects && !isError && projects.length === 0 && (
        <StatusMessage type="empty" action={<Link to="/tickets">See all tickets</Link>}>
          No projects have been set up yet. In the meantime, every team's work is tracked as
          tickets.
        </StatusMessage>
      )}

      {projects && !isError && projects.length > 0 && <ProjectList projects={projects} />}
    </>
  )
}

export default ProjectsPage
