import type { Project } from '../types.ts'
import { PROJECT_STATUS_LABELS } from '../utils/projectStatus.ts'
import './ProjectList.css'

interface ProjectListProps {
  projects: Project[]
}

// Every project as a simple card.
function ProjectList({ projects }: ProjectListProps) {
  return (
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
  )
}

export default ProjectList
