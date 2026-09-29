import StatusMessage from '../StatusMessage.tsx'
import EmployeeCard from './EmployeeCard.tsx'
import type { Employee } from '../../types.ts'
import './EmployeeList.css'

interface EmployeeListProps {
  employees: Employee[]
  // null when no employee is selected.
  selectedEmployeeId: number | null
  onSelectEmployee: (employeeId: number) => void
}

function EmployeeList({ employees, selectedEmployeeId, onSelectEmployee }: EmployeeListProps) {
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
