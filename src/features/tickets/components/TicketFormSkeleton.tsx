import Skeleton from '../../../components/Skeleton.tsx'
import './TicketForm.css'

// The fields of the edit form, in order, with each control's height:
// 8px padding top and bottom, 1px borders, and one 24px line of text
// (five lines for the description's textarea).
const FIELDS = [
  { key: 'title', controlHeight: '2.625rem' },
  { key: 'description', controlHeight: '8.625rem' },
  { key: 'priority', controlHeight: '2.625rem' },
  { key: 'team', controlHeight: '2.625rem' },
  { key: 'status', controlHeight: '2.625rem' },
]

// The loading placeholder for the edit form (TicketForm with its status
// field), using the form's own CSS classes: a label and a control for each
// field, then the two buttons. Wrap it in a SkeletonGroup.
function TicketFormSkeleton() {
  return (
    <div className="ticket-form">
      {FIELDS.map((field) => (
        <div key={field.key} className="ticket-form__field">
          {/* In a span, so it keeps the label's line height. */}
          <span>
            <Skeleton width="5rem" />
          </span>
          <Skeleton height={field.controlHeight} />
        </div>
      ))}
      <div className="ticket-form__actions">
        <Skeleton width="8.5rem" height="2.625rem" />
        <Skeleton width="5rem" height="2.625rem" />
      </div>
    </div>
  )
}

export default TicketFormSkeleton
