"use client"

import { Clock, CheckCircle2, XCircle, Loader2, GitBranch, Rocket } from "lucide-react"
import { motion } from "framer-motion"

interface Activity {
  id: string
  type: "deployment" | "alert" | "system"
  action: string
  description: string
  timestamp: string
  status?: "success" | "failed" | "running" | "pending"
}

interface ActivityFeedProps {
  activities: Activity[]
  maxItems?: number
}

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems)

  const getIcon = (type: string, status?: string) => {
    if (type === "deployment") {
      switch (status) {
        case "success":
          return <CheckCircle2 size={16} className="text-green-400" />
        case "failed":
          return <XCircle size={16} className="text-red-400" />
        case "running":
        case "pending":
          return <Loader2 size={16} className="text-yellow-400 animate-spin" />
        default:
          return <Rocket size={16} className="text-purple-400" />
      }
    }
    if (type === "alert") {
      return <Clock size={16} className="text-orange-400" />
    }
    return <GitBranch size={16} className="text-blue-400" />
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  if (displayActivities.length === 0) {
    return (
      <div className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Recent Activity</h3>
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-gray-400 text-sm">No recent activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">Recent Activity</h3>
      <div className="space-y-4">
        {displayActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(activity.type, activity.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{activity.action}</p>
              <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
              <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

