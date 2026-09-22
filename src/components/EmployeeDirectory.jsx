import { useState } from 'react'
import { employees } from '../data/employees.js'
import SearchBox from './SearchBox.jsx'
import DepartmentFilter from './DepartmentFilter.jsx'
import EmployeeList from './EmployeeList.jsx'
import EmployeeDetails from './EmployeeDetails.jsx'
import './EmployeeDirectory.css'

// Each unique department in the data, in the order it first appears.
// A Set drops duplicates; spreading it back into [] gives a normal array.
const departments = [...new Set(employees.map((employee) => employee.department))]

function EmployeeDirectory() {
  const [searchText, setSearchText] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)

  // Derived on every render from state, so it can never get out of sync.
  const normalizedSearch = searchText.trim().toLowerCase()
  const filteredEmployees = employees.filter((employee) => {
    const matchesName = employee.name.toLowerCase().includes(normalizedSearch)
    const matchesDepartment =
      selectedDepartment === '' || employee.department === selectedDepartment
    return matchesName && matchesDepartment
  })

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
        <DepartmentFilter
          departments={departments}
          value={selectedDepartment}
          onChange={setSelectedDepartment}
        />
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
