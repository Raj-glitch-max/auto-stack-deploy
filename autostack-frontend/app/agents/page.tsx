"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { AgentGrid } from "@/components/agents/agent-grid"
import { Modal } from "@/components/ui/modal"

export default function AgentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [agents, setAgents] = useState([
    {
      id: 1,
      name: "Agent-01",
      host: "prod-server-01",
      status: "online" as const,
      cpu: 45,
      memory: 62,
      lastHeartbeat: "30 seconds ago",
      ip: "192.168.1.101",
    },
    {
      id: 2,
      name: "Agent-02",
      host: "prod-server-02",
      status: "online" as const,
      cpu: 38,
      memory: 55,
      lastHeartbeat: "45 seconds ago",
      ip: "192.168.1.102",
    },
    {
      id: 3,
      name: "Agent-03",
      host: "staging-server",
      status: "offline" as const,
      cpu: 0,
      memory: 0,
      lastHeartbeat: "2 hours ago",
      ip: "192.168.1.103",
    },
    {
      id: 4,
      name: "Agent-04",
      host: "prod-server-03",
      status: "online" as const,
      cpu: 72,
      memory: 81,
      lastHeartbeat: "15 seconds ago",
      ip: "192.168.1.104",
    },
    {
      id: 5,
      name: "Agent-05",
      host: "backup-server",
      status: "online" as const,
      cpu: 28,
      memory: 42,
      lastHeartbeat: "1 minute ago",
      ip: "192.168.1.105",
    },
    {
      id: 6,
      name: "Agent-06",
      host: "dev-server",
      status: "online" as const,
      cpu: 55,
      memory: 68,
      lastHeartbeat: "20 seconds ago",
      ip: "192.168.1.106",
    },
  ])

  const onlineCount = agents.filter((a) => a.status === "online").length
  const offlineCount = agents.filter((a) => a.status === "offline").length

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

        {/* Agents Grid */}
        <AgentGrid agents={agents} />
      </div>

      {/* Add Agent Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Agent">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Agent Token</label>
            <input
              type="password"
              placeholder="Paste your agent token..."
              className="w-full bg-surface text-text border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition-smooth"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Agent Name</label>
            <input
              type="text"
              placeholder="e.g. Agent-07"
              className="w-full bg-surface text-text border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition-smooth"
            />
          </div>
          <button className="w-full bg-accent hover:bg-accent/90 text-background font-medium py-2 rounded-lg transition-smooth">
            Add Agent
          </button>
        </div>
      </Modal>
    </MainLayout>
  )
}
