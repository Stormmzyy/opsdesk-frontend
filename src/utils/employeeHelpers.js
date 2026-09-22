// Turns "Amara Okafor" into "AO" for the photo placeholder.
export function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

// Each unique department in the list, in the order it first appears.
// A Set drops duplicates; spreading it back into [] gives a normal array.
export function getDepartments(employees) {
  return [...new Set(employees.map((employee) => employee.department))]
}

// Keeps employees whose name contains searchText (case-insensitive) and who
// are in the given department. An empty department means "all departments".
export function filterEmployees(employees, searchText, department) {
  const normalizedSearch = searchText.trim().toLowerCase()

  return employees.filter((employee) => {
    const matchesName = employee.name.toLowerCase().includes(normalizedSearch)
    const matchesDepartment = department === '' || employee.department === department
    return matchesName && matchesDepartment
  })
}
