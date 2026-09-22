import { useState } from 'react'
import { employees } from '../data/employees.js'
import EmployeeList from './EmployeeList.jsx'
import EmployeeDetails from './EmployeeDetails.jsx'
import './EmployeeDirectory.css'

function EmployeeDirectory() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)

  const selectedEmployee = employees.find(
    (employee) => employee.id === selectedEmployeeId,
  )

  return (
    <div className="employee-directory">
      <header className="employee-directory__header">
        <h1>Employee Directory</h1>
      </header>

      <div className="employee-directory__content">
        <EmployeeList
          employees={employees}
          selectedEmployeeId={selectedEmployeeId}
          onSelectEmployee={setSelectedEmployeeId}
        />
        <EmployeeDetails employee={selectedEmployee} />
      </div>
    </div>
  )
}

export default EmployeeDirectory
