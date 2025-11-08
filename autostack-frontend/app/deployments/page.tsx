"use client"

import { useState, useEffect, type ComponentProps } from "react"
import { Plus } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { NewDeploymentModal } from "@/components/deployments/new-deployment-modal"
import { DeploymentsTable } from "@/components/deployments/deployments-table"
import { LogModal } from "@/components/deployments/log-modal"
import type { DeploymentData } from "@/components/deployments/new-deployment-modal"
import api from "@/lib/api"

export default function DeploymentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deployments, setDeployments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // For logs modal
  const [selectedDeployId, setSelectedDeployId] = useState<string | null>(null)
  const [isLogsOpen, setIsLogsOpen] = useState(false)

  useEffect(() => {
    async function fetchDeployments() {
      // Only fetch if user has token
      if (typeof window === 'undefined') return
      const token = localStorage.getItem("access_token")
      if (!token) return
      
      try {
        const res = await api.get("/deployments")
        setDeployments(res.data.deployments || [])
      } catch (err) {
        // harmless if endpoint doesn't exist yet
        console.error("Failed to load deployments:", err)
      }
    }
    fetchDeployments()
  }, [])

  async function handleDeploy(data: DeploymentData) {
    const repoUrl = data.repoUrl
    const branch = data.branch || "main"

    setLoading(true)
    try {
      const res = await api.post("/deploy", { repo: repoUrl, branch, environment: "dev" })
      const deploy_id = res.data.deploy_id

      const newDeployment = {
        id: deploy_id,
        repo: repoUrl.split("/").pop() || "new-app",
        branch,
        status: "queued",
        deployedAt: "just now",
      }

      setDeployments((prev) => [newDeployment, ...prev])
      pollStatus(deploy_id)
    } catch (err) {
      console.error("Deploy failed:", err)
      alert("Deployment request failed.")
    } finally {
      setLoading(false)
    }
  }

  async function pollStatus(deploy_id: string) {
    let done = false
    while (!done) {
      try {
        const res = await api.get(`/status/${deploy_id}`)
        const data = res.data

        setDeployments((prev) =>
          prev.map((d) => (String(d.id) === String(deploy_id) ? { ...d, status: data.status } : d))
        )

        if (Array.isArray(data.logs) && data.logs.length) {
          // optionally update deployedAt with last log timestamp or keep as-is
        }

        if (["success", "failed"].includes(data.status)) done = true
        else await new Promise((r) => setTimeout(r, 3000))
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

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Deployments</h1>
            <p className="text-text-secondary">Manage and monitor all your deployments</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={loading}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-background font-medium px-4 py-2.5 rounded-lg transition-smooth"
          >
            <Plus size={20} />
            {loading ? "Deploying..." : "Deploy New App"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-6">
            <p className="text-text-secondary text-sm mb-2">Successful</p>
            <p className="text-3xl font-bold text-success">
              {deployments.filter((d) => d.status === "success").length}
            </p>
          </div>
          <div className="glass rounded-xl p-6">
            <p className="text-text-secondary text-sm mb-2">Failed</p>
            <p className="text-3xl font-bold text-error">
              {deployments.filter((d) => d.status === "failed").length}
            </p>
          </div>
          <div className="glass rounded-xl p-6">
            <p className="text-text-secondary text-sm mb-2">In Progress</p>
            <p className="text-3xl font-bold text-warning">
              {deployments.filter((d) =>
                ["queued", "running", "building", "cloning"].includes(d.status)
              ).length}
            </p>
          </div>
        </div>

        {/* Deployments Table */}
        <DeploymentsTable
          {...({ deployments, onViewLogs: openLogs } as unknown as ComponentProps<typeof DeploymentsTable>)}
        />
      </div>

      <NewDeploymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDeploy={handleDeploy}
      />

      <LogModal {...({ deployId: selectedDeployId, isOpen: isLogsOpen, onClose: closeLogs } as unknown as ComponentProps<typeof LogModal>)} />
    </MainLayout>
  )
}

