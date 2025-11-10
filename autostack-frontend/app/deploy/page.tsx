"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { GitHubConnect } from "@/components/GitHubConnect"
import { RepoSelector } from "@/components/RepoSelector"
import { DeployButton } from "@/components/DeployButton"
import { DeploymentList } from "@/components/DeploymentList"
import { LogModal } from "@/components/deployments/log-modal"
import api from "@/lib/api"
import { CheckCircle2, ExternalLink, Copy, X } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

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

export default function DeployPage() {
  const router = useRouter()
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState<string | null>(null)
  const [deploymentId, setDeploymentId] = useState<string | null>(null)
  const [githubConnected, setGithubConnected] = useState(false)
  const [successDeployment, setSuccessDeployment] = useState<Deployment | null>(null)
  
  // Log modal state
  const [logModal, setLogModal] = useState<{
    isOpen: boolean
    deployId: string
    repo: string
    status: string
  }>({
    isOpen: false,
    deployId: "",
    repo: "",
    status: "",
  })

  // Check authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("access_token")
      if (!token) {
        router.push("/login")
      }
    }
  }, [router])

  // Check GitHub connection
  useEffect(() => {
    checkGitHubConnection()
    fetchDeployments()
  }, [])

  const checkGitHubConnection = async () => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) return

      // Check if user has GitHub token by trying to fetch repos
      await api.get("/github/repos")
      setGithubConnected(true)
    } catch (err: any) {
      if (err.response?.status === 400 || err.response?.status === 401) {
        setGithubConnected(false)
      }
    }
  }

  const fetchDeployments = async () => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) return

      const response = await api.get("/deployments")
      const data = response.data.deployments || []
      setDeployments(data)
    } catch (err) {
      console.error("Error fetching deployments:", err)
    }
  }

  const handleDeploy = async () => {
    if (!selectedRepo) {
      alert("Please select a repository first")
      return
    }

    try {
      setDeploying(true)
      setDeploymentStatus("queued")
      setSuccessDeployment(null)

      const response = await api.post("/deploy", {
        repo: selectedRepo.clone_url,
        branch: selectedBranch || selectedRepo.default_branch,
        environment: "production",
      })

      const newDeploymentId = response.data.deploy_id
      setDeploymentId(newDeploymentId)

      // Add to deployments list
      const newDeployment: Deployment = {
        id: newDeploymentId,
        repo: selectedRepo.clone_url,
        branch: selectedBranch || selectedRepo.default_branch,
        status: "queued",
        created_at: new Date().toISOString(),
        logs: "",
      }
      setDeployments((prev) => [newDeployment, ...prev])

      // Poll for deployment status
      pollDeploymentStatus(newDeploymentId)
    } catch (err: any) {
      console.error("Deploy error:", err)
      setDeploymentStatus("failed")
      alert(err.response?.data?.detail || "Failed to start deployment")
    } finally {
      setDeploying(false)
    }
  }

  const pollDeploymentStatus = async (deployId: string) => {
    let pollCount = 0
    const maxPolls = 300 // 10 minutes max (2 seconds * 300)

    const poll = async () => {
      try {
        const response = await api.get(`/status/${deployId}`)
        const deployment = response.data

        // Update deployment in list
        setDeployments((prev) =>
          prev.map((d) =>
            d.id === deployId
              ? {
                  ...d,
                  status: deployment.status,
                  logs: deployment.logs || "",
                  url: deployment.url,
                  port: deployment.port,
                }
              : d
          )
        )

        setDeploymentStatus(deployment.status)

        // If deployment is complete
        if (deployment.status === "success") {
          const successDeploy: Deployment = {
            id: deployment.id,
            repo: deployment.repo,
            branch: deployment.branch,
            status: deployment.status,
            created_at: deployment.created_at,
            logs: deployment.logs || "",
            url: deployment.url,
            port: deployment.port,
          }
          setSuccessDeployment(successDeploy)
          fetchDeployments() // Refresh list
          return
        }

        // If deployment failed
        if (deployment.status === "failed") {
          fetchDeployments() // Refresh list
          return
        }

        // Continue polling if still running
        if (["queued", "running", "building", "cloning"].includes(deployment.status) && pollCount < maxPolls) {
          pollCount++
          setTimeout(poll, 2000) // Poll every 2 seconds
        }
      } catch (err) {
        console.error("Polling error:", err)
        setDeploymentStatus("failed")
      }
    }

    poll()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black text-white px-6 pt-10 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <Breadcrumbs items={[{ label: "Deploy" }]} />
          
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

          {/* Success Banner */}
          <AnimatePresence>
            {successDeployment && successDeployment.url && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-400 mb-2">
                        Deployment Successful! 🎉
                      </h3>
                      <p className="text-gray-300 mb-4">
                        Your application has been deployed and is now live.
                      </p>
                      <div className="flex items-center gap-3">
                        <a
                          href={successDeployment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 font-medium transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Application
                        </a>
                        <button
                          onClick={() => copyToClipboard(successDeployment.url!)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Copy URL
                        </button>
                      </div>
                      <p className="text-sm text-gray-400 mt-3">
                        URL: <span className="text-gray-300 font-mono">{successDeployment.url}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSuccessDeployment(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                <div>
                <RepoSelector
                    onSelect={(repo) => {
                      setSelectedRepo(repo)
                      setSelectedBranch(repo.default_branch)
                    }}
                  selectedRepo={selectedRepo}
                />
                </div>

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
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </motion.div>
                )}

                {/* Deployment Status */}
                {deploymentStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      {deploymentStatus === "queued" && (
                        <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                      )}
                      {deploymentStatus === "running" && (
                        <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                      )}
                      {deploymentStatus === "success" && (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      )}
                      {deploymentStatus === "failed" && (
                        <X className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <p className="font-medium text-white capitalize">{deploymentStatus}</p>
                        <p className="text-sm text-gray-400">
                          {deploymentStatus === "queued" && "Your deployment is queued"}
                          {deploymentStatus === "running" && "Deployment in progress..."}
                          {deploymentStatus === "success" && "Deployment completed successfully"}
                          {deploymentStatus === "failed" && "Deployment failed"}
                        </p>
                      </div>
                    </div>
                    {deploymentId && (
                      <button
                        onClick={() =>
                          setLogModal({
                            isOpen: true,
                            deployId: deploymentId,
                            repo: selectedRepo?.name || "Unknown",
                            status: deploymentStatus,
                          })
                        }
                        className="mt-3 text-sm text-purple-400 hover:text-purple-300 underline"
                      >
                        View Live Logs
                      </button>
                    )}
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
                  onDeployStart={(deployId) => {
                    setDeploymentId(deployId)
                    setDeploymentStatus("queued")
                    pollDeploymentStatus(deployId)
                  }}
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
              <h2 className="text-2xl font-bold mb-6">Recent Deployments</h2>
              <DeploymentList refreshTrigger={deployments.length} />
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

      {/* Logs Modal */}
      <LogModal
        isOpen={logModal.isOpen}
        onClose={() =>
          setLogModal({
            isOpen: false,
            deployId: "",
            repo: "",
            status: "",
          })
        }
        deployId={logModal.deployId}
        repo={logModal.repo}
        status={logModal.status}
      />
    </>
  )
}
