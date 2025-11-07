"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import api from "@/lib/api"
import { useAuth } from "@/components/AuthProvider"
import { LogModal } from "@/components/deployments/log-modal"

interface Deployment {
  id: string
  repo: string
  branch: string
  status: string
  deployedAt: string
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [logModal, setLogModal] = useState<{ isOpen: boolean; repo: string; status: string }>({
    isOpen: false,
    repo: "",
    status: "",
  })

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  useEffect(() => {
    if (user) fetchDeployments()
  }, [user])

  const fetchDeployments = async () => {
    try {
      const res = await api.get("/deployments")
      // FastAPI returns { deployments: [...] } — extract it properly
      const data = res.data.deployments || res.data
      setDeployments(data)
    } catch (err) {
      console.error("Error fetching deployments:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewDeploy = async () => {
    const repoUrl = prompt("Enter GitHub repo URL:")
    if (!repoUrl) return
    try {
      const payload = { repo: repoUrl }
      const res = await api.post("/deploy", payload)
      console.log("Started deploy:", res.data)
      await fetchDeployments()
    } catch (err) {
      console.error("Error creating deploy:", err)
    }
  }

  if (loading || isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading dashboard...
      </div>
    )

  if (!user) return null

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h1 className="text-3xl font-semibold">Projects</h1>
            <p className="text-gray-400 text-sm">
              Manage your deployments and infrastructure
            </p>
          </div>
          <button
            onClick={handleNewDeploy}
            className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition text-sm font-medium"
          >
            + New Project
          </button>
        </motion.div>

        {/* Deployments list */}
        {deployments.length === 0 ? (
          <div className="border border-white/10 rounded-xl p-10 text-center text-gray-400">
            <p className="text-2xl mb-2">No projects yet</p>
            <p className="mb-6">Create your first project to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deployments.map((d) => (
              <motion.div
                key={d.id}
                whileHover={{ scale: 1.02 }}
                className="border border-white/10 rounded-lg p-4 flex justify-between items-center bg-[#111]/70 backdrop-blur"
              >
                <div>
                  <p className="text-sm text-gray-400">{d.repo}</p>
                  <p className="text-lg font-medium">{d.branch}</p>
                </div>
                <div className="flex items-center gap-3">
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
                  <button
                    onClick={() =>
                      setLogModal({
                        isOpen: true,
                        repo: d.repo,
                        status: d.status,
                      })
                    }
                    className="text-purple-400 hover:text-purple-300 text-sm"
                  >
                    View Logs
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Logs Modal */}
      <LogModal
        isOpen={logModal.isOpen}
        onClose={() => setLogModal({ isOpen: false, repo: "", status: "" })}
        repo={logModal.repo}
        status={logModal.status}
      />
    </div>
  )
}

