import { projects } from '../data/projects.ts'
import PageHeader from '../components/PageHeader.tsx'
import ProjectList from '../features/projects/components/ProjectList.tsx'

function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projects" description="What each team is working on right now." />
      <ProjectList projects={projects} />
    </>
  )
}

export default ProjectsPage
