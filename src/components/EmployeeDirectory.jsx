import { useState } from 'react'
import { employees } from '../data/employees.js'
import SearchBox from './SearchBox.jsx'
import EmployeeList from './EmployeeList.jsx'
import EmployeeDetails from './EmployeeDetails.jsx'
import './EmployeeDirectory.css'

function EmployeeDirectory() {
  const [searchText, setSearchText] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)

  // Derived on every render from state, so it can never get out of sync.
  const normalizedSearch = searchText.trim().toLowerCase()
  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(normalizedSearch),
  )

  const selectedEmployee = employees.find(
    (employee) => employee.id === selectedEmployeeId,
  )

  return (
    <div className="employee-directory">
      <header className="employee-directory__header">
        <h1>Employee Directory</h1>
      </header>

      <div className="employee-directory__filters">
        <SearchBox value={searchText} onChange={setSearchText} />
      </div>

      <div className="employee-directory__content">
        <EmployeeList
          employees={filteredEmployees}
          selectedEmployeeId={selectedEmployeeId}
          onSelectEmployee={setSelectedEmployeeId}
        />
        <EmployeeDetails employee={selectedEmployee} />
      </div>
    </div>
  )
}

export default EmployeeDirectory
