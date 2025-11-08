"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { AlertsTable } from "@/components/alerts/alerts-table"
import api from "@/lib/api"
import { useAuth } from "@/components/AuthProvider"

interface Alert {
  id: string
  severity: "critical" | "warning" | "info"
  source: string
  message: string
  resolved: boolean
  created_at: string
}

export default function AlertsPage() {
  const auth = useAuth()
  const user = auth?.user
  const authLoading = auth?.loading
  const [filter, setFilter] = useState<"all" | "critical" | "warning">("all")
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      fetchAlerts()
    }
  }, [user, authLoading])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get("/alerts")
      setAlerts(res.data || [])
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch alerts")
      console.error("Error fetching alerts:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await api.patch(`/alerts/${id}`, { resolved: true })
      await fetchAlerts()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to dismiss alert")
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffSecs < 60) return `${diffSecs} seconds ago`
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  // Transform API data to match component expectations
  const transformedAlerts = alerts
    .filter(alert => !alert.resolved) // Only show unresolved alerts
    .map(alert => ({
      id: alert.id,
      severity: alert.severity,
      source: alert.source,
      message: alert.message,
      timestamp: formatTimestamp(alert.created_at),
    }))

  const filteredAlerts = filter === "all" 
    ? transformedAlerts 
    : transformedAlerts.filter((alert) => alert.severity === filter)

  const criticalCount = transformedAlerts.filter((a) => a.severity === "critical").length
  const warningCount = transformedAlerts.filter((a) => a.severity === "warning").length

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-text-secondary">Loading alerts...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Alerts</h1>
          <p className="text-text-secondary">Monitor system alerts and notifications</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-error text-sm">
            {error}
          </div>
        )}

        {/* Alert Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-6">
            <p className="text-text-secondary text-sm mb-2">Total Alerts</p>
            <p className="text-3xl font-bold text-text">{transformedAlerts.length}</p>
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
