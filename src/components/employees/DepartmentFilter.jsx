function DepartmentFilter({ departments, value, onChange }) {
  return (
    <div className="filter-field">
      <label htmlFor="department-filter">Department</label>
      <select
        id="department-filter"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {/* An empty value means "don't filter by department". */}
        <option value="">All departments</option>
        {departments.map((department) => (
          <option key={department} value={department}>
            {department}
          </option>
        ))}
      </select>
    </div>
  )
}

export default DepartmentFilter
