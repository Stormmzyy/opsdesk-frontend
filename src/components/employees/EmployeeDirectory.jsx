import { useState } from 'react'
import { employees } from '../../data/employees.js'
import { filterEmployees, getDepartments } from '../../utils/employeeHelpers.js'
import SearchBox from './SearchBox.jsx'
import DepartmentFilter from './DepartmentFilter.jsx'
import EmployeeList from './EmployeeList.jsx'
import EmployeeDetails from './EmployeeDetails.jsx'
import './EmployeeDirectory.css'

// The data never changes, so this only needs working out once.
const departments = getDepartments(employees)

function EmployeeDirectory() {
  const [searchText, setSearchText] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)

  // Derived on every render from state, so it can never get out of sync.
  const filteredEmployees = filterEmployees(employees, searchText, selectedDepartment)

  // Look in the filtered list, so a selected employee who gets filtered out
  // is no longer shown in the details panel.
  const selectedEmployee = filteredEmployees.find(
    (employee) => employee.id === selectedEmployeeId,
  )

  return (
    <section aria-labelledby="employee-directory-heading">
      <header className="employee-directory__header">
        <h2 id="employee-directory-heading">Employee Directory</h2>
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
    </section>
  )
}

export default EmployeeDirectory
