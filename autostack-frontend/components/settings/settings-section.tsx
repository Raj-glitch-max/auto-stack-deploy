import type { ReactNode } from "react"

interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="glass rounded-xl p-6 animate-fade-in-slide-up">
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      {description && <p className="text-sm text-text-secondary mb-4">{description}</p>}
      <div className="space-y-3">{children}</div>
    </div>
  )
}
