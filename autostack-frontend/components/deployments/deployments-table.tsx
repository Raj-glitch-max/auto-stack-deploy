"use client"

import { CheckCircle2, AlertCircle, Loader2, MoreVertical } from "lucide-react"
import React from "react"
import type { Dispatch, SetStateAction } from "react"

interface Deployment {
  id: number
  repo: string
  branch: string
  status: "success" | "failed" | "running"
  deployedAt: string
}

interface DeploymentsTableProps {
  deployments: Deployment[]
}

const statusConfig = {
  success: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  failed: { icon: AlertCircle, color: "text-error", bg: "bg-error/10" },
  running: { icon: Loader2, color: "text-warning", bg: "bg-warning/10" },
}

export function DeploymentsTable({ deployments }: DeploymentsTableProps) {
  return (
    <div className="glass rounded-xl p-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-text-secondary">Repository</th>
            <th className="text-left py-3 px-4 text-text-secondary">Branch</th>
            <th className="text-left py-3 px-4 text-text-secondary">Status</th>
            <th className="text-left py-3 px-4 text-text-secondary">Deployed</th>
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
                <td className="py-4 px-4 text-text-secondary">{deployment.branch}</td>
                <td className="py-4 px-4">
                  <div className={`flex items-center gap-2 w-fit px-3 py-1 rounded-lg ${config.bg}`}>
                    <Icon size={16} className={config.color} />
                    <span className="text-xs font-medium capitalize">{deployment.status}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-text-secondary">{deployment.deployedAt}</td>
                <td className="py-4 px-4">
                  <button className="p-1 hover:bg-surface rounded-lg transition-smooth">
                    <MoreVertical size={16} className="text-text-secondary" />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
