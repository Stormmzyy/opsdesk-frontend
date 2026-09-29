import { projects, PROJECT_STATUS_LABELS } from '../data/projects.ts'
import PageHeader from '../components/PageHeader.tsx'
import './ProjectsPage.css'

function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projects" description="What each team is working on right now." />

      <ul className="project-list">
        {projects.map((project) => (
          <li key={project.id} className="project-card">
            <h2>{project.name}</h2>
            <p className="project-card__description">{project.description}</p>
            <dl className="project-card__facts">
              <div>
                <dt>Status</dt>
                <dd>{PROJECT_STATUS_LABELS[project.status]}</dd>
              </div>
              <div>
                <dt>Team</dt>
                <dd>{project.team}</dd>
              </div>
              <div>
                <dt>Lead</dt>
                <dd>{project.lead}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}

export default ProjectsPage
