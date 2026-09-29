import './StatCard.css'

interface StatCardProps {
  label: string
  value: number
}

// A single number with a label under it, e.g. "4" / "Open".
function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <p className="stat-card__value">{value}</p>
      <p className="stat-card__label">{label}</p>
    </div>
  )
}

export default StatCard
