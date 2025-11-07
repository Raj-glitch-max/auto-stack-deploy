"use client"

import { AlertTriangle, AlertCircle, Info, X } from "lucide-react"

interface Alert {
  id: number
  severity: "critical" | "warning" | "info"
  source: string
  message: string
  timestamp: string
}

interface AlertsTableProps {
  alerts: Alert[]
  onDismiss: (id: number) => void
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    color: "text-error",
    bg: "bg-error/10",
    label: "Critical",
  },
  warning: {
    icon: AlertCircle,
    color: "text-warning",
    bg: "bg-warning/10",
    label: "Warning",
  },
  info: { icon: Info, color: "text-accent", bg: "bg-accent/10", label: "Info" },
}

export function AlertsTable({ alerts, onDismiss }: AlertsTableProps) {
  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const config = severityConfig[alert.severity]
        const Icon = config.icon
        return (
          <div
            key={alert.id}
            className="glass rounded-lg p-4 border-l-4"
            style={{
              borderLeftColor:
                alert.severity === "critical" ? "#e74c3c" : alert.severity === "warning" ? "#f39c12" : "#3498db",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className={`mt-0.5 ${config.color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-text-secondary">{alert.source}</span>
                  </div>
                  <p className="text-sm text-text">{alert.message}</p>
                  <p className="text-xs text-text-secondary mt-2">{alert.timestamp}</p>
                </div>
              </div>
              <button
                onClick={() => onDismiss(alert.id)}
                className="p-1 hover:bg-surface rounded transition-smooth flex-shrink-0"
              >
                <X size={18} className="text-text-secondary" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
