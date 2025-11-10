"use client"

import { useState, useEffect } from "react"
import { Plus, Package } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { NewDeploymentModal } from "@/components/deployments/new-deployment-modal"
import { DeploymentsTable } from "@/components/deployments/deployments-table"
import { LogsDrawer } from "@/components/logs/logs-drawer"
import { EmptyState } from "@/components/ui/empty-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Filters } from "@/components/ui/filters"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { SkeletonTable } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Download } from "lucide-react"
import type { DeploymentData } from "@/components/deployments/new-deployment-modal"
import api from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Deployment {
  id: string
  repo: string
  branch: string
  status: string
  created_at: string
  logs: string
  url?: string
  port?: number
  environment: string
}

export default function DeploymentsPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // For logs drawer
  const [selectedDeployId, setSelectedDeployId] = useState<string | null>(null)
  const [isLogsOpen, setIsLogsOpen] = useState(false)
  
  // For delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; deployId: string | null }>({ isOpen: false, deployId: null })
  
  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    // Check authentication
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("access_token")
      if (!token) {
        router.push("/login")
        return
      }
    }
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
  }, [])

  async function fetchDeployments() {
    setRefreshing(true)
    try {
      const res = await api.get("/deployments")
      const data = res.data.deployments || []
      
      // Sort by created_at (newest first)
      const sorted = data.sort((a: Deployment, b: Deployment) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      
      setDeployments(sorted)
    } catch (err) {
      console.error("Failed to load deployments:", err)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  async function handleDeploy(data: DeploymentData) {
    const repoUrl = data.repoUrl
    const branch = data.branch || "main"
    const repoName = repoUrl.split("/").pop()?.replace(".git", "") || "repository"

    setLoading(true)
    try {
      const res = await api.post("/deploy", {
        repo: repoUrl,
        branch,
        environment: data.environment || "production",
      })
      const deploy_id = res.data.deploy_id

      // Show success toast
      toast.success(`Deploy started for ${repoName}@${branch}. This may take ~1–2 min.`)

      // Fetch updated deployments
      await fetchDeployments()
      
      // Start polling for this deployment
      pollStatus(deploy_id)
    } catch (err: any) {
      console.error("Deploy failed:", err)
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        toast.error("Session expired. Please retry.")
      } else {
        toast.error(err.response?.data?.detail || "Deployment request failed.")
      }
    } finally {
      setLoading(false)
      setIsModalOpen(false)
    }
  }

  async function pollStatus(deploy_id: string) {
    let done = false
    let pollCount = 0
    const maxPolls = 300 // 10 minutes max

    while (!done && pollCount < maxPolls) {
      try {
        await new Promise((r) => setTimeout(r, 2000)) // Wait 2 seconds
        
        const res = await api.get(`/status/${deploy_id}`)
        const data = res.data

        // Update deployments list
        setDeployments((prev) =>
          prev.map((d) =>
            String(d.id) === String(deploy_id)
              ? {
                  ...d,
                  status: data.status,
                  logs: data.logs || "",
                  url: data.url,
                  port: data.port,
                  error_message: data.error_message,
                }
              : d
          )
        )

        if (["success", "failed"].includes(data.status)) {
          done = true
          await fetchDeployments() // Refresh list
          
          // Show completion toast
          if (data.status === "success") {
            const deployment = deployments.find(d => String(d.id) === String(deploy_id))
            const url = data.url || deployment?.url
            if (url) {
              toast.success(`Live at ${url}. We'll keep logs for 24h.`)
            } else {
              toast.success("Deployment completed successfully!")
            }
          } else if (data.status === "failed") {
            toast.error("Deployment failed. Check logs for details.")
          }
        }
        
        pollCount++
      } catch (e) {
        console.error("Polling error:", e)
        done = true
      }
    }
  }

  function openLogs(deployId: string) {
    setSelectedDeployId(deployId)
    setIsLogsOpen(true)
  }

  function closeLogs() {
    setSelectedDeployId(null)
    setIsLogsOpen(false)
  }
  
  function handleRedeploy(deployId: string) {
    // Placeholder for redeploy functionality
    toast.info("Redeploy feature coming soon!")
  }
  
  function handleDeleteClick(deployId: string) {
    setDeleteDialog({ isOpen: true, deployId })
  }
  
  async function handleDeleteConfirm() {
    if (!deleteDialog.deployId) return
    
    // Double-check feature flag (should already be hidden in UI)
    const canDelete = process.env.NEXT_PUBLIC_FEATURE_DELETE === "true"
    if (!canDelete) {
      toast.error("Delete feature is not available")
      setDeleteDialog({ isOpen: false, deployId: null })
      return
    }
    
    try {
      // Call delete API if it exists
      await api.delete(`/deployments/${deleteDialog.deployId}`)
      toast.success("Deployment deleted successfully")
      await fetchDeployments()
    } catch (err: any) {
      console.error("Delete failed:", err)
      toast.error(err.response?.data?.detail || "Failed to delete deployment")
    } finally {
      setDeleteDialog({ isOpen: false, deployId: null })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const exportDeployments = () => {
    const data = filteredDeployments.map((d) => ({
      id: d.id,
      repo: d.repo,
      branch: d.branch,
      status: d.status,
      created_at: d.created_at,
      url: d.url,
      port: d.port,
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `deployments-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Deployments exported successfully")
  }

  // Filter and sort deployments
  const filteredDeployments = deployments
    .filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          d.repo.toLowerCase().includes(query) ||
          d.branch.toLowerCase().includes(query) ||
          d.id.toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "status":
          return a.status.localeCompare(b.status)
        case "repo":
          return a.repo.localeCompare(b.repo)
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  // Paginate deployments
  const totalPages = Math.ceil(filteredDeployments.length / itemsPerPage)
  const paginatedDeployments = filteredDeployments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, sortBy, searchQuery])

  const successfulCount = deployments.filter((d) => d.status === "success").length
  const failedCount = deployments.filter((d) => d.status === "failed").length
  const inProgressCount = deployments.filter((d) =>
    ["queued", "running", "building", "cloning"].includes(d.status)
  ).length

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: "Deployments" }]} />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Deployments</h1>
            <p className="text-text-secondary text-sm sm:text-base">Manage and monitor all your deployments</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {filteredDeployments.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={exportDeployments}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-text font-medium transition-smooth"
                    >
                      <Download size={18} />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Export deployments as JSON</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={loading}
              className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-background font-medium px-4 py-2.5 rounded-lg transition-smooth"
            >
              <Plus size={20} />
              {loading ? "Deploying..." : "Deploy New App"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass rounded-xl p-6">
            <p className="text-text-secondary text-sm mb-2">Total</p>
            <p className="text-3xl font-bold text-text">{deployments.length}</p>
          </div>
          <div className="glass rounded-xl p-6">
            <p className="text-text-secondary text-sm mb-2">Successful</p>
            <p className="text-3xl font-bold text-success">{successfulCount}</p>
          </div>
          <div className="glass rounded-xl p-6">
            <p className="text-text-secondary text-sm mb-2">Failed</p>
            <p className="text-3xl font-bold text-error">{failedCount}</p>
          </div>
          <div className="glass rounded-xl p-6">
            <p className="text-text-secondary text-sm mb-2">In Progress</p>
            <p className="text-3xl font-bold text-warning">{inProgressCount}</p>
          </div>
        </div>

        {/* Filters */}
        {deployments.length > 0 && (
          <Filters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {/* Loading State */}
        {loading && deployments.length === 0 ? (
          <div className="glass rounded-xl p-6">
            <SkeletonTable />
          </div>
        ) : filteredDeployments.length === 0 && deployments.length === 0 ? (
          <div className="glass rounded-xl">
            <EmptyState
              icon={<Package size={64} className="text-gray-600" />}
              title="No deployments yet"
              description="Deploy your first application to get started with AutoStack. Connect your GitHub repository and deploy in minutes."
              primaryCta={{
                label: "Deploy a Repository",
                onClick: () => router.push("/deploy"),
              }}
              secondaryCta={{
                label: "Connect GitHub",
                onClick: () => router.push("/settings"),
              }}
            />
          </div>
        ) : filteredDeployments.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-text-secondary mb-2">No deployments match your filters</p>
            <button
              onClick={() => {
                setStatusFilter("all")
                setSearchQuery("")
              }}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <DeploymentsTable
              deployments={paginatedDeployments.map((d) => ({
                id: d.id,
                repo: d.repo.split("/").pop()?.replace(".git", "") || d.repo,
                branch: d.branch,
                status: d.status as "success" | "failed" | "running" | "queued",
                deployedAt: new Date(d.created_at).toLocaleString(),
                url: d.url,
                port: d.port,
              }))}
              onViewLogs={openLogs}
              onRedeploy={handleRedeploy}
              onDelete={handleDeleteClick}
              onBulkAction={(action, ids) => {
                if (action === "delete") {
                  ids.forEach((id) => handleDeleteClick(id))
                } else if (action === "redeploy") {
                  ids.forEach((id) => handleRedeploy(id))
                }
              }}
              showBulkActions={true}
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredDeployments.length}
              />
            )}
          </>
        )}
      </div>

      <NewDeploymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDeploy={handleDeploy}
      />

      {selectedDeployId && (
        <LogsDrawer
          isOpen={isLogsOpen}
          onClose={closeLogs}
          deploymentId={selectedDeployId}
        />
      )}
      
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, deployId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete this deployment?"
        description="The container stops and the URL will no longer work."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
      />
    </MainLayout>
  )
}
