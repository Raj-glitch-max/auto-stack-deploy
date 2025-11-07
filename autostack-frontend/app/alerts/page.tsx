"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { AlertsTable } from "@/components/alerts/alerts-table"

export default function AlertsPage() {
  const [filter, setFilter] = useState<"all" | "critical" | "warning">("all")
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      severity: "critical" as const,
      source: "api-gateway",
      message: "High CPU usage detected (92% for 5 minutes)",
      timestamp: "2 minutes ago",
    },
    {
      id: 2,
      severity: "warning" as const,
      source: "database-service",
      message: "Memory usage above threshold (78%)",
      timestamp: "15 minutes ago",
    },
    {
      id: 3,
      severity: "warning" as const,
      source: "cache-service",
      message: "Connection pool utilization high",
      timestamp: "1 hour ago",
    },
    {
      id: 4,
      severity: "critical" as const,
      source: "worker-service",
      message: "Failed health check - service unresponsive",
      timestamp: "3 hours ago",
    },
    {
      id: 5,
      severity: "info" as const,
      source: "web-frontend",
      message: "Deployment completed successfully",
      timestamp: "5 hours ago",
    },
  ])

  const handleDismiss = (id: number) => {
    setAlerts(alerts.filter((alert) => alert.id !== id))
  }

  const filteredAlerts = filter === "all" ? alerts : alerts.filter((alert) => alert.severity === filter)

  const criticalCount = alerts.filter((a) => a.severity === "critical").length
  const warningCount = alerts.filter((a) => a.severity === "warning").length

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Alerts</h1>
          <p className="text-text-secondary">Monitor system alerts and notifications</p>
        </div>

        {/* Alert Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-6">
            <p className="text-text-secondary text-sm mb-2">Total Alerts</p>
            <p className="text-3xl font-bold text-text">{alerts.length}</p>
          </div>
          <div className="glass rounded-xl p-6 border-l-4 border-error">
            <p className="text-text-secondary text-sm mb-2">Critical</p>
            <p className="text-3xl font-bold text-error">{criticalCount}</p>
          </div>
          <div className="glass rounded-xl p-6 border-l-4 border-warning">
            <p className="text-text-secondary text-sm mb-2">Warnings</p>
            <p className="text-3xl font-bold text-warning">{warningCount}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-3">
          {(["all", "critical", "warning"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
                filter === f ? "bg-accent text-background" : "bg-surface hover:bg-surface-light text-text"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div>
          {filteredAlerts.length > 0 ? (
            <AlertsTable alerts={filteredAlerts} onDismiss={handleDismiss} />
          ) : (
            <div className="glass rounded-xl p-12 text-center">
              <AlertTriangle size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
              <p className="text-text-secondary">No alerts to display</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
