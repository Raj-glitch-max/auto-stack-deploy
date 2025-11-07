"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface Agent {
  id: number
  name: string
  host: string
  status: "online" | "offline"
  cpu: number
  memory: number
  lastHeartbeat: string
  ip: string
}

interface AgentGridProps {
  agents: Agent[]
}

export function AgentGrid({ agents }: AgentGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <TooltipProvider key={agent.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="glass rounded-xl p-6 cursor-help transition-smooth hover:bg-surface/90">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-text">{agent.name}</h3>
                    <p className="text-xs text-text-secondary">{agent.host}</p>
                  </div>
                  <div
                    className={`p-2 rounded-lg ${
                      agent.status === "online" ? "bg-success/10 text-success" : "bg-error/10 text-error"
                    }`}
                  >
                    {agent.status === "online" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">CPU Usage</span>
                      <span className="text-sm font-semibold text-text">{agent.cpu}%</span>
                    </div>
                    <div className="w-full bg-surface-light rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          agent.cpu > 80 ? "bg-error" : agent.cpu > 60 ? "bg-warning" : "bg-success"
                        }`}
                        style={{ width: `${agent.cpu}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">Memory</span>
                      <span className="text-sm font-semibold text-text">{agent.memory}%</span>
                    </div>
                    <div className="w-full bg-surface-light rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          agent.memory > 80 ? "bg-error" : agent.memory > 60 ? "bg-warning" : "bg-success"
                        }`}
                        style={{ width: `${agent.memory}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-text-secondary">Last heartbeat: {agent.lastHeartbeat}</p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p>
                  <span className="text-text-secondary">IP:</span> {agent.ip}
                </p>
                <p>
                  <span className="text-text-secondary">Status:</span> {agent.status}
                </p>
                <p>
                  <span className="text-text-secondary">Last Heartbeat:</span> {agent.lastHeartbeat}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}
