import type { Employee } from '../types.ts'
import type { Ticket } from '../../tickets/types.ts'
import { getDepartments } from './employeeHelpers.ts'
import { isOpenTicket } from '../../tickets/utils/ticketStatus.ts'

export interface TeamSummary {
  name: string
  memberCount: number
  openTicketCount: number
}

// Builds one summary per team (department), for example:
// { name: 'Engineering', memberCount: 3, openTicketCount: 2 }
export function getTeamSummaries(employees: Employee[], tickets: Ticket[]): TeamSummary[] {
  return getDepartments(employees).map((team) => ({
    name: team,
    memberCount: employees.filter((employee) => employee.department === team).length,
    openTicketCount: tickets.filter(
      (ticket) => ticket.team === team && isOpenTicket(ticket),
    ).length,
  }))
}
