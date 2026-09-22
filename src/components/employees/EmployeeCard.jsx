import { getInitials } from '../../utils/employeeHelpers.js'
import './EmployeeCard.css'

function EmployeeCard({ employee, isSelected, onSelect }) {
  // A <button> is focusable and responds to Enter and Space out of the box,
  // so the card is keyboard-accessible without any extra key handling.
  return (
    <button
      type="button"
      className={isSelected ? 'employee-card employee-card--selected' : 'employee-card'}
      aria-pressed={isSelected}
      onClick={() => onSelect(employee.id)}
    >
      <span className="employee-card__avatar" aria-hidden="true">
        {getInitials(employee.name)}
      </span>
      <span className="employee-card__name">{employee.name}</span>
      <span className="employee-card__department">{employee.department}</span>
    </button>
  )
}

export default EmployeeCard
