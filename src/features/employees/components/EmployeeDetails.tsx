import type { Employee } from '../types.ts'
import './EmployeeDetails.css'

interface EmployeeDetailsProps {
  // undefined when nobody is selected (find() found no match).
  employee: Employee | undefined
}

function EmployeeDetails({ employee }: EmployeeDetailsProps) {
  if (!employee) {
    return (
      <section className="employee-details employee-details--empty">
        <p>Select an employee to see their details.</p>
      </section>
    )
  }

  return (
    <section className="employee-details">
      {/* <h3>: this panel sits inside the "Employee Directory" <h2> section. */}
      <h3>{employee.name}</h3>
      <dl>
        <dt>Role</dt>
        <dd>{employee.role}</dd>

        <dt>Department</dt>
        <dd>{employee.department}</dd>

        <dt>Email</dt>
        <dd>
          <a href={`mailto:${employee.email}`}>{employee.email}</a>
        </dd>

        <dt>Location</dt>
        <dd>{employee.location}</dd>
      </dl>
    </section>
  )
}

export default EmployeeDetails
