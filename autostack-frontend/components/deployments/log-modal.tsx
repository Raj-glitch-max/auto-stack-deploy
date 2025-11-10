"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import api from "@/lib/api"

interface LogModalProps {
  isOpen: boolean
  onClose: () => void
  deployId: string | null
  repo: string
  status: string
}

export function LogModal({ isOpen, onClose, deployId, repo, status }: LogModalProps) {
  const [logs, setLogs] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs])

  // Fetch logs from backend
  useEffect(() => {
    if (!isOpen || !deployId) {
      setLogs("")
      setError(null)
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      return
    }

    const fetchLogs = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.get(`/status/${deployId}`)
        const deployment = response.data
        
        if (deployment.logs) {
          setLogs(deployment.logs)
        } else {
          setLogs("No logs available yet...")
        }

        // Stop polling if deployment is completed
        if (["success", "failed"].includes(deployment.status)) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
        }
      } catch (err: any) {
        console.error("Error fetching logs:", err)
        setError(err.response?.data?.detail || "Failed to fetch logs")
      } finally {
        setLoading(false)
      }
    }

    // Fetch logs immediately
    fetchLogs()

    // Poll for updates if deployment is still running
    if (!["success", "failed"].includes(status)) {
      pollIntervalRef.current = setInterval(fetchLogs, 2000) // Poll every 2 seconds
    }

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [isOpen, deployId, status])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-[#111] border border-white/10 rounded-xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Deployment Logs</h2>
            <p className="text-sm text-gray-400 mt-1">{repo}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-hidden bg-[#0a0a0f] border border-white/10 rounded-lg">
          <div className="h-full overflow-y-auto p-4 font-mono text-sm text-gray-300">
            {loading && logs === "" ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full" />
              </div>
            ) : logs ? (
              <pre className="whitespace-pre-wrap break-words">{logs}</pre>
            ) : (
              <div className="text-gray-500">No logs available yet...</div>
            )}
            <div ref={logEndRef} />
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {status === "running" && (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-3 w-3 border-2 border-purple-500 border-t-transparent rounded-full" />
                Live logs (updating every 2 seconds)
              </span>
            )}
            {status === "success" && (
              <span className="text-green-400">✅ Deployment completed successfully</span>
            )}
            {status === "failed" && (
              <span className="text-red-400">❌ Deployment failed</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition text-sm font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
