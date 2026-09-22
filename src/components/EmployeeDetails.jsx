import './EmployeeDetails.css'

function EmployeeDetails({ employee }) {
  if (!employee) {
    return (
      <section className="employee-details employee-details--empty">
        <p>Select an employee to see their details.</p>
      </section>
    )
  }

  return (
    <section className="employee-details">
      <h2>{employee.name}</h2>
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
