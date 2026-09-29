import StatCard from '../../../components/StatCard.tsx'
import { employees } from '../../../data/employees.ts'
import { getDepartments } from '../utils/employeeHelpers.ts'

// How many employees and teams there are.
function PeopleSummary() {
  return (
    <div className="stat-grid">
      <StatCard label="Employees" value={employees.length} />
      <StatCard label="Teams" value={getDepartments(employees).length} />
    </div>
  )
}

export default PeopleSummary
