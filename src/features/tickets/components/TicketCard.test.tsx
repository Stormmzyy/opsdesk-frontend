import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../test/renderWithProviders.tsx'
import type { Ticket } from '../types.ts'
import TicketCard from './TicketCard.tsx'

// A ticket written out in full, so the test shows exactly what it works with.
const sampleTicket: Ticket = {
  id: 7,
  title: 'Printer on floor 2 is jammed',
  description: 'The paper jam warning will not clear.',
  priority: 'HIGH',
  status: 'OPEN',
  team: 'Operations',
}

describe('TicketCard', () => {
  it('shows the ticket title as a link to its detail page', () => {
    // vi.fn() is a "mock function": a stand-in that records how it's called.
    renderWithProviders(<TicketCard ticket={sampleTicket} onMoveTicket={vi.fn()} />)

    // Find the link the way a screen reader would: by its role and name.
    const titleLink = screen.getByRole('link', { name: sampleTicket.title })
    expect(titleLink).toBeInTheDocument()
    expect(titleLink).toHaveAttribute('href', '/tickets/7')
  })

  it('asks to move the ticket to the next status when the move button is pressed', async () => {
    const onMoveTicket = vi.fn()
    const { user } = renderWithProviders(
      <TicketCard ticket={sampleTicket} onMoveTicket={onMoveTicket} />,
    )

    // A regular expression (/.../i), so a small wording change like
    // "Move to In Progress" wouldn't break the test.
    await user.click(screen.getByRole('button', { name: /move to in progress/i }))

    expect(onMoveTicket).toHaveBeenCalledTimes(1)
    expect(onMoveTicket).toHaveBeenCalledWith(7, 'IN_PROGRESS')
  })
})
