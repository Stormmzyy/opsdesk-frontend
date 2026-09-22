import { getDepartments } from './employeeHelpers.js'
import { isOpenTicket } from './ticketStatus.js'

// Builds one summary per team (department), for example:
// { name: 'Engineering', memberCount: 3, openTicketCount: 2 }
export function getTeamSummaries(employees, tickets) {
  return getDepartments(employees).map((team) => ({
    name: team,
    memberCount: employees.filter((employee) => employee.department === team).length,
    openTicketCount: tickets.filter(
      (ticket) => ticket.team === team && isOpenTicket(ticket),
    ).length,
  }))
}
