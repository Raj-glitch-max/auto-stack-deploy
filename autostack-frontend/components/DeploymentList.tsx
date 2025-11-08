"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import api from "@/lib/api"

interface Deployment {
  id: string
  repo: string
  branch: string
  status: string
  created_at: string
  logs: string
  url?: string
  port?: number
}

export function DeploymentList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDeploy, setSelectedDeploy] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  // Don't fetch automatically - only when user has token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("access_token")
      if (token && !hasFetched) {
        fetchDeployments()
        setHasFetched(true)
      }
    }
  }, [refreshTrigger, hasFetched])

  const fetchDeployments = async () => {
    try {
      const response = await api.get("/deployments")
      setDeployments(response.data.deployments)
    } catch (error) {
      console.error("Error fetching deployments:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-400 bg-green-500/10 border-green-500/20"
      case "running":
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
      <h2 className="text-xl font-bold mb-4">Recent Deployments</h2>
      
      {deployments.map((deploy, index) => (
        <motion.div
          key={deploy.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-medium text-lg">{deploy.repo.split('/').pop()?.replace('.git', '')}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(deploy.status)}`}>
                  {getStatusIcon(deploy.status)}
                  {deploy.status}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {deploy.branch}
                </span>
                <span>{new Date(deploy.created_at).toLocaleString()}</span>
              </div>

              {deploy.url && (
                <a
                  href={deploy.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {deploy.url}
                </a>
              )}
            </div>

            <button
              onClick={() => setSelectedDeploy(selectedDeploy === deploy.id ? null : deploy.id)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className={`w-5 h-5 transition-transform ${selectedDeploy === deploy.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {selectedDeploy === deploy.id && deploy.logs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-black/50 rounded-lg p-4 font-mono text-xs overflow-x-auto"
            >
              <div className="text-green-400 mb-2">Deployment Logs:</div>
              <pre className="text-gray-300 whitespace-pre-wrap">{deploy.logs}</pre>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
