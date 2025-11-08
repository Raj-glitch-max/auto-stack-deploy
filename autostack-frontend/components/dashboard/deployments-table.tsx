"use client"

import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

const deployments = [
  {
    id: 1,
    repo: "auth-service",
    status: "success" as const,
    time: "2 hours ago",
  },
  {
    id: 2,
    repo: "api-gateway",
    status: "running" as const,
    time: "15 minutes ago",
  },
  {
    id: 3,
    repo: "web-frontend",
    status: "failed" as const,
    time: "5 hours ago",
  },
  {
    id: 4,
    repo: "worker-service",
    status: "success" as const,
    time: "1 day ago",
  },
  {
    id: 5,
    repo: "cache-service",
    status: "success" as const,
    time: "3 days ago",
  },
]

const statusConfig = {
  success: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  failed: { icon: AlertCircle, color: "text-error", bg: "bg-error/10" },
  running: { icon: Loader2, color: "text-warning", bg: "bg-warning/10" },
}

export function DeploymentsTable() {
  return (
    <div className="glass rounded-xl p-6 overflow-x-auto">
      <h3 className="text-lg font-semibold mb-4 text-text">Latest Deployments</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-text-secondary">Repository</th>
            <th className="text-left py-3 px-4 text-text-secondary">Status</th>
            <th className="text-left py-3 px-4 text-text-secondary">Time</th>
            <th className="text-left py-3 px-4 text-text-secondary">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deployments.map((deployment) => {
            const config = statusConfig[deployment.status]
            const Icon = config.icon
            return (
              <tr key={deployment.id} className="border-b border-white/10 hover:bg-surface-light transition-smooth">
                <td className="py-4 px-4 text-text font-medium">{deployment.repo}</td>
                <td className="py-4 px-4">
                  <div className={`flex items-center gap-2 w-fit px-3 py-1 rounded-lg ${config.bg}`}>
                    <Icon size={16} className={config.color} />
                    <span className="text-xs font-medium capitalize">{deployment.status}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-text-secondary">{deployment.time}</td>
                <td className="py-4 px-4">
                  <button className="text-accent hover:text-accent/80 text-xs font-medium">View</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
