"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { AgentGrid } from "@/components/agents/agent-grid"
import { Modal } from "@/components/ui/modal"
import api from "@/lib/api"
import { useAuth } from "@/components/AuthProvider"




interface Agent {
  id: string
  name: string
  host: string
  status: "online" | "offline"
  cpu_usage: number
  memory_usage: number
  last_heartbeat: string | null
  ip: string
}

export default function AgentsPage() {
  const auth = useAuth()
  const user = auth?.user
  const authLoading = auth?.loading
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [registerForm, setRegisterForm] = useState({ name: "", host: "", ip: "" })
  const [registerLoading, setRegisterLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      fetchAgents()
    }
  }, [user, authLoading])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get("/agents")
      setAgents(res.data || [])
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch agents")
      console.error("Error fetching agents:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterLoading(true)
    try {
      await api.post("/agents/register", registerForm)
      setRegisterForm({ name: "", host: "", ip: "" })
      setIsModalOpen(false)
      await fetchAgents()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to register agent")
    } finally {
      setRegisterLoading(false)
    }
  }

  const formatLastHeartbeat = (timestamp: string | null) => {
    if (!timestamp) return "Never"
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffSecs < 60) return `${diffSecs} seconds ago`
    if (diffMins < 60) return `${diffMins} minutes ago`
    return `${diffHours} hours ago`
  }

  // Transform API data to match component expectations
  const transformedAgents = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    host: agent.host,
    status: agent.status as "online" | "offline",
    cpu: agent.cpu_usage,
    memory: agent.memory_usage,
    lastHeartbeat: formatLastHeartbeat(agent.last_heartbeat),
    ip: agent.ip,
  }))

  const onlineCount = transformedAgents.filter((a) => a.status === "online").length
  const offlineCount = transformedAgents.filter((a) => a.status === "offline").length

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-text-secondary">Loading agents...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Agents</h1>
            <p className="text-text-secondary">Monitor and manage your deployment agents</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-background font-medium px-4 py-2.5 rounded-lg transition-smooth"
          >
            <Plus size={20} />
            Add Agent
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-6">
            <p className="text-text-secondary text-sm mb-2">Total Agents</p>
            <p className="text-3xl font-bold text-text">{agents.length}</p>
          </div>
          <div className="glass rounded-xl p-6 border-l-4 border-success">
            <p className="text-text-secondary text-sm mb-2">Online</p>
            <p className="text-3xl font-bold text-success">{onlineCount}</p>
          </div>
          <div className="glass rounded-xl p-6 border-l-4 border-error">
            <p className="text-text-secondary text-sm mb-2">Offline</p>
            <p className="text-3xl font-bold text-error">{offlineCount}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-error text-sm">
            {error}
          </div>
        )}

        {/* Agents Grid */}
        {transformedAgents.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-text-secondary mb-4">No agents registered yet</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-accent hover:text-accent/80 transition"
            >
              Register your first agent
            </button>
          </div>
        ) : (
          <AgentGrid agents={transformedAgents} />
        )}
      </div>

      {/* Add Agent Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Agent">
        <form onSubmit={handleRegisterAgent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Agent Name</label>
            <input
              type="text"
              placeholder="e.g. Agent-01"
              required
              className="w-full bg-surface text-text border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition-smooth"
              value={registerForm.name}
              onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Host</label>
            <input
              type="text"
              placeholder="e.g. prod-server-01"
              required
              className="w-full bg-surface text-text border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition-smooth"
              value={registerForm.host}
              onChange={(e) => setRegisterForm({ ...registerForm, host: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">IP Address</label>
            <input
              type="text"
              placeholder="e.g. 192.168.1.100"
              required
              className="w-full bg-surface text-text border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition-smooth"
              value={registerForm.ip}
              onChange={(e) => setRegisterForm({ ...registerForm, ip: e.target.value })}
            />
          </div>
          <button 
            type="submit"
            disabled={registerLoading}
            className={`w-full bg-accent hover:bg-accent/90 text-background font-medium py-2 rounded-lg transition-smooth ${
              registerLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {registerLoading ? "Registering..." : "Register Agent"}
          </button>
        </form>
      </Modal>
    </MainLayout>
  )
}
