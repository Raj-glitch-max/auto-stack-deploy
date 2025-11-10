"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import api from "@/lib/api"

interface Repo {
  name: string
  full_name: string
  clone_url: string
  default_branch: string
}

interface DeployButtonProps {
  repo: Repo | null
  branch?: string
  onDeployStart?: (deployId: string) => void
}

export function DeployButton({ repo, branch, onDeployStart }: DeployButtonProps) {
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeploy = async () => {
    if (!repo) {
      setError("Please select a repository first")
      return
    }

    try {
      setDeploying(true)
      setError(null)

      const response = await api.post("/deploy", {
        repo: repo.clone_url,
        branch: branch || repo.default_branch,
        environment: "production",
      })

      const deployId = response.data.deploy_id

      if (onDeployStart) {
        onDeployStart(deployId)
      }
    } catch (err: any) {
      console.error("Deploy error:", err)
      setError(err.response?.data?.detail || "Failed to start deployment")
    } finally {
      setDeploying(false)
    }
  }

  if (!repo) {
    return (
      <button
        disabled
        className="w-full bg-gray-700/50 text-gray-400 rounded-lg px-6 py-3 font-medium cursor-not-allowed border border-gray-700/50"
      >
        Select a repository to deploy
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <motion.button
        whileHover={{ scale: deploying ? 1 : 1.02 }}
        whileTap={{ scale: deploying ? 1 : 0.98 }}
        onClick={handleDeploy}
        disabled={deploying}
        className={`w-full rounded-lg px-6 py-3 font-medium transition-all shadow-lg ${
          deploying
            ? "bg-purple-600/50 cursor-wait"
            : "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 hover:shadow-xl"
        } text-white flex items-center justify-center gap-2`}
      >
        {deploying ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            <span>Deploying...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Deploy Now</span>
          </>
        )}
      </motion.button>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}
    </div>
  )
}
