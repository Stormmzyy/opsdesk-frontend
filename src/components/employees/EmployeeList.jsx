import StatusMessage from '../common/StatusMessage.jsx'
import EmployeeCard from './EmployeeCard.jsx'
import './EmployeeList.css'

function EmployeeList({ employees, selectedEmployeeId, onSelectEmployee }) {
  if (employees.length === 0) {
    return <StatusMessage type="empty">No employees match your search.</StatusMessage>
  }

  return (
    <ul className="employee-list">
      {employees.map((employee) => (
        <li key={employee.id}>
          <EmployeeCard
            employee={employee}
            isSelected={employee.id === selectedEmployeeId}
            onSelect={onSelectEmployee}
          />
        </li>
      ))}
    </ul>
  )
}

export default EmployeeList
