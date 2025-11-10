"use client"

import { CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react"

type StatusType = "success" | "running" | "failed" | "pending"

interface StatusPillProps {
  status: StatusType
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    label: "Success",
  },
  running: {
    icon: Loader2,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: "Running",
  },
  failed: {
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Failed",
  },
  pending: {
    icon: Clock,
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
    label: "Pending",
  },
}

export function StatusPill({ status }: StatusPillProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} w-[120px]`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <Icon
        size={14}
        className={`${config.color} ${status === "running" ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  )
}
