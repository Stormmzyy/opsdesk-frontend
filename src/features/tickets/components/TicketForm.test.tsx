import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../test/renderWithProviders.tsx'
import type { TicketFormValues } from '../types.ts'
import TicketForm from './TicketForm.tsx'

const emptyTicket: TicketFormValues = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  team: 'Engineering',
}

describe('TicketForm', () => {
  it('shows an error linked to the title field when submitted with an empty title', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithProviders(
      <TicketForm
        initialValues={emptyTicket}
        onSubmit={onSubmit}
        submitLabel="Create ticket"
        onCancel={vi.fn()}
      />,
    )

    // Submit the way a person would: by pressing the button.
    await user.click(screen.getByRole('button', { name: /create ticket/i }))

    // The field is found by its label, which also proves the label is linked.
    const titleField = screen.getByRole('textbox', { name: /title/i })

    // 1. The field is marked as having a problem.
    expect(titleField).toHaveAttribute('aria-invalid', 'true')
    // 2. The error is LINKED to the field: it's the field's accessible
    //    description (via aria-describedby), so screen readers read it out
    //    with the field. Just appearing somewhere on the page isn't enough.
    expect(titleField).toHaveAccessibleDescription(/title is required/i)
    // 3. Focus moved to the field, so keyboard users land right on it.
    expect(titleField).toHaveFocus()
    // 4. Nothing was submitted.
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
