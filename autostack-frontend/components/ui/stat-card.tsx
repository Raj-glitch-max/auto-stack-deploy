import type { ReactNode } from "react"

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  unit?: string
  trend?: number
  trendLabel?: string
}

export function StatCard({ icon, label, value, unit, trend, trendLabel }: StatCardProps) {
  const isPositive = (trend ?? 0) >= 0

  return (
    <div className="rounded-xl bg-surface-light hover:bg-surface transition-smooth p-6 shadow-md hover:shadow-[0_0_20px_rgba(0,246,199,0.15)]">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-accent-soft rounded-lg text-accent">{icon}</div>
        {trend !== undefined && (
          <div className={`text-sm font-medium ${isPositive ? "text-success" : "text-error"}`}>
            {isPositive ? "+" : ""}
            {trend}%
          </div>
        )}
      </div>
      <p className="text-text-secondary text-sm mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-text">{value}</span>
        {unit && <span className="text-text-secondary text-sm">{unit}</span>}
      </div>
      {trendLabel && <p className="text-xs text-text-secondary mt-3">{trendLabel}</p>}
    </div>
  )
}

