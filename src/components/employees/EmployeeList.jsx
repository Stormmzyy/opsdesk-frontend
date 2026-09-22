import EmployeeCard from './EmployeeCard.jsx'
import './EmployeeList.css'

function EmployeeList({ employees, selectedEmployeeId, onSelectEmployee }) {
  if (employees.length === 0) {
    return <p className="employee-list-empty">No employees match your search.</p>
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
