"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import api from "@/lib/api"
import { LogModal } from "@/components/deployments/log-modal"
import { Navbar } from "@/components/navbar"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton, SkeletonMetricCard, SkeletonList } from "@/components/ui/skeleton"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { ExternalLink, Copy, Eye, Package, TrendingUp, Activity, CheckCircle2 } from "lucide-react"
import { DeploymentStatusChart } from "@/components/dashboard/deployment-status-chart"
import { DeploymentTimelineChart } from "@/components/dashboard/deployment-timeline-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { SystemMetricsChart } from "@/components/dashboard/system-metrics-chart"
import { OnboardingTour } from "@/components/onboarding/onboarding-tour"
import { useOnboarding } from "@/hooks/use-onboarding"

interface Deployment {
  id: string
  repo: string
  branch: string
  status: string
  deployedAt: string
  url?: string
  port?: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { shouldShow, markComplete, dismiss } = useOnboarding()

  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [logModal, setLogModal] = useState<{ isOpen: boolean; deployId: string; repo: string; status: string }>({
    isOpen: false,
    deployId: "",
    repo: "",
    status: "",
  })
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    // Check for token instead of user (since AuthProvider is disabled)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("access_token")
      if (!token) {
        router.push("/login")
      }
    }
  }, [router])

  // Show onboarding tour for new users
  useEffect(() => {
    if (shouldShow && !isLoading && deployments.length === 0) {
      // Delay tour to ensure page is fully loaded
      const timer = setTimeout(() => {
        setShowTour(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [shouldShow, isLoading, deployments.length])

  useEffect(() => {
    // Only fetch if we're in browser and have token
    if (typeof window === 'undefined') return
    const token = localStorage.getItem("access_token")
    if (!token) return
    
    // Fetch data if we have a token
    fetchDeployments()
    fetchMetrics()

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
  }, [])

  const fetchDeployments = async () => {
    try {
      const res = await api.get("/deployments")
      // FastAPI returns { deployments: [...] }
      const data = res.data.deployments || res.data || []
      setDeployments(data.map((d: any) => ({
        id: d.id,
        repo: d.repo,
        branch: d.branch,
        status: d.status,
        deployedAt: d.created_at ? new Date(d.created_at).toLocaleDateString() : "Unknown",
        url: d.url,
        port: d.port,
      })))
    } catch (err) {
      console.error("Error fetching deployments:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const res = await api.get("/metrics/overview")
      setMetrics(res.data)
    } catch (err) {
      console.error("Error fetching metrics:", err)
    }
  }

  const handleNewDeploy = () => {
    router.push("/deploy")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-black text-white px-6 pt-10">
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs items={[{ label: "Dashboard" }]} />
            <div className="mb-10">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
            </div>
            <SkeletonList />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black text-white px-4 sm:px-6 pt-10">
        <div className="max-w-6xl mx-auto">
        <Breadcrumbs items={[{ label: "Dashboard" }]} />
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <p className="text-gray-400 text-sm">
              Overview of your deployments and system metrics
            </p>
          </div>
          <button
            data-tour="new-deployment"
            onClick={handleNewDeploy}
            className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition text-sm font-medium"
          >
            + New Deployment
          </button>
        </motion.div>

        {/* Metrics Overview */}
        {metrics && (
          <motion.div
            data-tour="metrics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
          >
            <div className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">CPU Usage</p>
                <Activity size={16} className="text-purple-400" />
              </div>
              <p className="text-2xl font-semibold">{metrics.total_cpu_usage?.toFixed(1) || 0}%</p>
              <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-500"
                  style={{ width: `${metrics.total_cpu_usage || 0}%` }}
                />
              </div>
            </div>
            <div className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Memory Usage</p>
                <TrendingUp size={16} className="text-green-400" />
              </div>
              <p className="text-2xl font-semibold">{metrics.total_memory_usage?.toFixed(1) || 0}%</p>
              <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-emerald-500 transition-all duration-500"
                  style={{ width: `${metrics.total_memory_usage || 0}%` }}
                />
              </div>
            </div>
            <div className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Uptime</p>
                <CheckCircle2 size={16} className="text-blue-400" />
              </div>
              <p className="text-2xl font-semibold">{metrics.uptime_percentage?.toFixed(1) || 0}%</p>
              <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            </div>
            <div className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Active Agents</p>
                <Package size={16} className="text-yellow-400" />
              </div>
              <p className="text-2xl font-semibold">{metrics.active_agents || 0}/{metrics.total_agents || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.total_agents > 0
                  ? `${Math.round((metrics.active_agents / metrics.total_agents) * 100)}% active`
                  : "No agents"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Charts and Analytics */}
        {deployments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10"
          >
            <DeploymentStatusChart
              data={{
                success: deployments.filter((d) => d.status === "success").length,
                failed: deployments.filter((d) => d.status === "failed").length,
                running: deployments.filter((d) => ["running", "building", "cloning"].includes(d.status)).length,
                pending: deployments.filter((d) => d.status === "pending" || d.status === "queued").length,
              }}
            />
            <SystemMetricsChart />
          </motion.div>
        )}

        {/* Deployment Timeline and Activity Feed */}
        {deployments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10"
          >
            <DeploymentTimelineChart
              data={(() => {
                // Group deployments by date
                const grouped = deployments.reduce((acc, deployment) => {
                  // Parse date string - handle both Date objects and strings
                  const dateObj = deployment.deployedAt.includes("T") 
                    ? new Date(deployment.deployedAt)
                    : new Date(deployment.deployedAt + "T00:00:00")
                  const date = dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                  if (!acc[date]) {
                    acc[date] = { date, deployments: 0, successful: 0, failed: 0 }
                  }
                  acc[date].deployments++
                  if (deployment.status === "success") acc[date].successful++
                  if (deployment.status === "failed") acc[date].failed++
                  return acc
                }, {} as Record<string, { date: string; deployments: number; successful: number; failed: number }>)

                return Object.values(grouped).slice(-7) // Last 7 days
              })()}
            />
            <ActivityFeed
              activities={deployments
                .slice(0, 10)
                .map((d) => ({
                  id: d.id,
                  type: "deployment" as const,
                  action: `Deployment ${d.status === "success" ? "succeeded" : d.status === "failed" ? "failed" : "started"}`,
                  description: `${d.repo.split("/").pop()?.replace(".git", "")} @ ${d.branch}`,
                  timestamp: d.deployedAt.includes("T") ? d.deployedAt : d.deployedAt + "T00:00:00",
                  status: d.status as "success" | "failed" | "running" | "pending",
                }))}
              maxItems={5}
            />
          </motion.div>
        )}

        {/* Deployments list */}
        {deployments.length === 0 ? (
          <div className="border border-white/10 rounded-xl">
            <EmptyState
              icon={<Package size={64} className="text-gray-600" />}
              title="No deployments yet"
              description="Create your first deployment to get started with AutoStack. Deploy your applications in minutes."
              primaryCta={{
                label: "Deploy a Repository",
                onClick: handleNewDeploy,
              }}
              secondaryCta={{
                label: "Connect GitHub",
                onClick: () => router.push("/settings"),
              }}
            />
          </div>
        ) : (
          <div className="space-y-4" data-tour="deployments">
            <h2 className="text-xl font-semibold mb-4">Recent Deployments</h2>
            {deployments.slice(0, 5).map((d) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="border border-white/10 rounded-lg p-4 flex justify-between items-center bg-[#111]/70 backdrop-blur"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm text-gray-400 truncate">{d.repo.split('/').pop()?.replace('.git', '')}</p>
                    <span
                      className={`px-3 py-1 rounded text-sm capitalize ${
                        d.status === "success"
                          ? "bg-green-500/20 text-green-400"
                          : d.status === "failed"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                    <span>Branch: {d.branch}</span>
                    <span>{d.deployedAt}</span>
                  </div>
                  {d.url && (
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-400 hover:text-purple-300 font-mono truncate max-w-md"
                      >
                        {d.url}
                      </a>
                      <button
                        onClick={() => copyToClipboard(d.url!)}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <button
                    onClick={() =>
                      setLogModal({
                        isOpen: true,
                        deployId: d.id,
                        repo: d.repo.split('/').pop()?.replace('.git', '') || "Unknown",
                        status: d.status,
                      })
                    }
                    className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Logs
                  </button>
                </div>
              </motion.div>
            ))}
            {deployments.length > 5 && (
              <div className="text-center pt-4">
                <button
                  onClick={() => router.push("/deployments")}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  View All Deployments →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logs Modal */}
      <LogModal
        isOpen={logModal.isOpen}
        onClose={() => setLogModal({ isOpen: false, deployId: "", repo: "", status: "" })}
        deployId={logModal.deployId}
        repo={logModal.repo}
        status={logModal.status}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showTour}
        onClose={() => {
          setShowTour(false)
          dismiss()
        }}
        onComplete={() => {
          markComplete()
          setShowTour(false)
        }}
        steps={[
          {
            id: "welcome",
            title: "Welcome to AutoStack! 🎉",
            description:
              "Let's take a quick tour of your dashboard. You'll learn how to deploy applications, monitor metrics, and manage your deployments.",
            position: "center",
          },
          {
            id: "metrics",
            title: "System Metrics",
            description:
              "Monitor your system's CPU, memory, uptime, and active agents in real-time. These metrics update automatically every few seconds.",
            target: '[data-tour="metrics"]',
            position: "bottom",
          },
          {
            id: "deploy",
            title: "Deploy Your First App",
            description:
              "Click 'New Deployment' to deploy your first application. Connect your GitHub repository and we'll handle the rest!",
            target: '[data-tour="new-deployment"]',
            position: "bottom",
          },
          {
            id: "deployments",
            title: "View Your Deployments",
            description:
              "Once you have deployments, they'll appear here. You can view logs, check status, and manage them all from this dashboard.",
            target: '[data-tour="deployments"]',
            position: "top",
          },
          {
            id: "complete",
            title: "You're All Set! 🚀",
            description:
              "You now know the basics of AutoStack. Start deploying your applications and explore more features in the navigation menu.",
            position: "center",
          },
        ]}
      />
      </div>
    </>
  )
}
