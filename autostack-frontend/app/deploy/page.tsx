"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { GitHubConnect } from "@/components/GitHubConnect"
import { RepoSelector } from "@/components/RepoSelector"
import { DeployButton } from "@/components/DeployButton"
import { DeploymentList } from "@/components/DeploymentList"

interface Repo {
  id: number
  name: string
  full_name: string
  clone_url: string
  default_branch: string
  description: string | null
  private: boolean
  updated_at: string
}

export default function DeployPage() {
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleDeployStart = (deployId: string) => {
    console.log("Deployment started:", deployId)
    // Refresh the deployment list
    setRefreshTrigger(prev => prev + 1)
    // Reset selection
    setTimeout(() => {
      setSelectedRepo(null)
      setSelectedBranch("")
    }, 2000)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black text-white px-6 pt-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Deploy Your App
            </h1>
            <p className="text-gray-400">
              Connect your GitHub account and deploy your repositories with one click
            </p>
          </motion.div>

          {/* GitHub Connection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <GitHubConnect />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Deploy Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6"
            >
              <h2 className="text-2xl font-bold mb-6">New Deployment</h2>

              <div className="space-y-6">
                {/* Repo Selector */}
                <RepoSelector
                  onSelect={setSelectedRepo}
                  selectedRepo={selectedRepo}
                />

                {/* Branch Selector */}
                {selectedRepo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={selectedBranch || selectedRepo.default_branch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      placeholder={selectedRepo.default_branch}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </motion.div>
                )}

                {/* Environment Info */}
                {selectedRepo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
                  >
                    <h3 className="text-sm font-medium text-blue-400 mb-2">Deployment Info</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Auto-detect project type (Node.js, Python, Go, Static)</li>
                      <li>• Build Docker image automatically</li>
                      <li>• Deploy to available port (10000-20000)</li>
                      <li>• Get live URL instantly</li>
                    </ul>
                  </motion.div>
                )}

                {/* Deploy Button */}
                <DeployButton
                  repo={selectedRepo}
                  branch={selectedBranch || selectedRepo?.default_branch}
                  onDeployStart={handleDeployStart}
                />
              </div>
            </motion.div>

            {/* Deployment List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6"
            >
              <DeploymentList refreshTrigger={refreshTrigger} />
            </motion.div>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 grid md:grid-cols-3 gap-6"
          >
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-400">Deploy in seconds with auto-detection and Docker containerization</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Secure & Isolated</h3>
              <p className="text-sm text-gray-400">Each deployment runs in its own Docker container with isolated resources</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Live Monitoring</h3>
              <p className="text-sm text-gray-400">Watch deployment logs in real-time and monitor app status</p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
