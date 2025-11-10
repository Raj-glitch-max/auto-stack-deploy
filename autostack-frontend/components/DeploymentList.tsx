"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import api from "@/lib/api"
import { ExternalLink, Copy, Eye, ChevronDown, ChevronUp } from "lucide-react"

interface Deployment {
  id: string
  repo: string
  branch: string
  status: string
  created_at: string
  logs: string
  url?: string
  port?: number
  error_message?: string
}

export function DeploymentList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDeploy, setExpandedDeploy] = useState<string | null>(null)
  const [selectedDeployForLogs, setSelectedDeployForLogs] = useState<string | null>(null)

  useEffect(() => {
    fetchDeployments()
    
    // Auto-refresh every 5 seconds if there are active deployments
    const interval = setInterval(() => {
      const hasActiveDeployments = deployments.some(
        d => ["queued", "running", "building", "cloning"].includes(d.status)
      )
      if (hasActiveDeployments) {
        fetchDeployments()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [refreshTrigger])

  const fetchDeployments = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null
      if (!token) {
        setLoading(false)
        return
      }

      const response = await api.get("/deployments")
      const data = response.data.deployments || []
      
      // Sort by created_at (newest first)
      const sorted = data.sort((a: Deployment, b: Deployment) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      
      setDeployments(sorted)
    } catch (err) {
      console.error("Error fetching deployments:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-400 bg-green-500/10 border-green-500/20"
      case "running":
      case "building":
      case "cloning":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20"
      case "failed":
        return "text-red-400 bg-red-500/10 border-red-500/20"
      case "queued":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case "running":
      case "building":
      case "cloning":
        return (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        )
      case "failed":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case "queued":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add toast notification here
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (deployments.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="text-lg font-medium text-gray-400 mb-2">No deployments yet</h3>
        <p className="text-sm text-gray-500">Deploy your first repository to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {deployments.map((deploy, index) => {
        const repoName = deploy.repo.split("/").pop()?.replace(".git", "") || "Unknown"
        const isExpanded = expandedDeploy === deploy.id

        return (
          <motion.div
            key={deploy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-lg truncate">{repoName}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 whitespace-nowrap ${getStatusColor(
                      deploy.status
                    )}`}
                  >
                    {getStatusIcon(deploy.status)}
                    {deploy.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {deploy.branch}
                  </span>
                  <span>{formatDate(deploy.created_at)}</span>
                  {deploy.port && <span>Port: {deploy.port}</span>}
                </div>

                {/* Deployment URL */}
                {deploy.url && deploy.status === "success" && (
                  <div className="mb-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">Deployment URL</p>
                        <a
                          href={deploy.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-400 hover:text-green-300 font-mono truncate block"
                        >
                          {deploy.url}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={deploy.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4 text-green-400" />
                        </a>
                        <button
                          onClick={() => copyToClipboard(deploy.url!)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {deploy.error_message && deploy.status === "failed" && (
                  <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-400 font-medium mb-1">Error</p>
                    <p className="text-sm text-red-300">{deploy.error_message}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {deploy.logs && (
                    <button
                      onClick={() => setSelectedDeployForLogs(deploy.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-purple-400 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Logs
                    </button>
                  )}
                  {deploy.url && deploy.status === "success" && (
                    <a
                      href={deploy.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-green-400 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open App
                    </a>
                  )}
                </div>
              </div>

              {/* Expand/Collapse Button */}
              {deploy.logs && (
                <button
                  onClick={() => setExpandedDeploy(isExpanded ? null : deploy.id)}
                  className="text-gray-400 hover:text-white transition-colors p-1 ml-2"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>

            {/* Expanded Logs */}
            <AnimatePresence>
              {isExpanded && deploy.logs && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-black/50 rounded-lg p-4 font-mono text-xs overflow-x-auto"
                >
                  <div className="text-green-400 mb-2 font-semibold">Deployment Logs:</div>
                  <pre className="text-gray-300 whitespace-pre-wrap break-words">{deploy.logs}</pre>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
