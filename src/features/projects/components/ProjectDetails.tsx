import type { Project } from '../types.ts'
import { PROJECT_STATUS_LABELS } from '../utils/projectStatus.ts'
import './ProjectDetails.css'

interface ProjectDetailsProps {
  project: Project
}

// A project's description, status, team and lead.
function ProjectDetails({ project }: ProjectDetailsProps) {
  return (
    <div className="project-detail">
      <h2>Description</h2>
      <p className="project-detail__description">{project.description}</p>

      <h2>Details</h2>
      <dl className="project-detail__facts">
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
    </div>
  )
}

export default ProjectDetails
