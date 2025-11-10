"use client"

import { MoreVertical, Eye, ExternalLink, Copy, RefreshCw, Trash2, CheckSquare, Square } from "lucide-react"
import React, { useState } from "react"
import { StatusPill } from "@/components/ui/status-pill"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Deployment {
  id: string
  repo: string
  branch: string
  status: "success" | "failed" | "running" | "queued"
  deployedAt: string
  url?: string
  port?: number
}

interface DeploymentsTableProps {
  deployments: Deployment[]
  onViewLogs: (deployId: string) => void
  onRedeploy?: (deployId: string) => void
  onDelete?: (deployId: string) => void
  onBulkAction?: (action: string, ids: string[]) => void
  showBulkActions?: boolean
}

export function DeploymentsTable({ 
  deployments, 
  onViewLogs, 
  onRedeploy, 
  onDelete,
  onBulkAction,
  showBulkActions = false,
}: DeploymentsTableProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const canDelete = process.env.NEXT_PUBLIC_FEATURE_DELETE === "true"
  const canRedeploy = process.env.NEXT_PUBLIC_FEATURE_REDEPLOY === "true"

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (selectedIds.size === deployments.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(deployments.map((d) => d.id)))
    }
  }

  const handleBulkDelete = () => {
    if (onBulkAction && selectedIds.size > 0) {
      onBulkAction("delete", Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  const handleBulkRedeploy = () => {
    if (onBulkAction && selectedIds.size > 0) {
      onBulkAction("redeploy", Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  const isAllSelected = selectedIds.size === deployments.length && deployments.length > 0
  const hasSelection = selectedIds.size > 0

  if (deployments.length === 0) {
    return (
      <div className="glass rounded-xl p-12 text-center">
        <p className="text-text-secondary mb-4">No deployments yet</p>
        <p className="text-text-secondary text-sm">Deploy your first app to get started</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-6 overflow-x-auto">
      {/* Bulk Actions Bar */}
      {showBulkActions && hasSelection && (
        <div className="mb-4 p-3 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-white font-medium">
              {selectedIds.size} {selectedIds.size === 1 ? "item" : "items"} selected
            </span>
            <div className="flex items-center gap-2">
              {canRedeploy && onBulkAction && (
                <button
                  onClick={handleBulkRedeploy}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
                >
                  Redeploy Selected
                </button>
              )}
              {canDelete && onBulkAction && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                >
                  Delete Selected
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear Selection
          </button>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {showBulkActions && (
              <th className="text-left py-3 px-4 text-text-secondary w-12">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={selectAll}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label={isAllSelected ? "Deselect all" : "Select all"}
                      >
                        {isAllSelected ? (
                          <CheckSquare size={18} className="text-purple-400" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{isAllSelected ? "Deselect all" : "Select all"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
            )}
            <th className="text-left py-3 px-4 text-text-secondary">Repository</th>
            <th className="text-left py-3 px-4 text-text-secondary">Branch</th>
            <th className="text-left py-3 px-4 text-text-secondary">Status</th>
            <th className="text-left py-3 px-4 text-text-secondary">Deployed</th>
            <th className="text-left py-3 px-4 text-text-secondary">URL</th>
            <th className="text-left py-3 px-4 text-text-secondary">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deployments.map((deployment) => {
            const isSelected = selectedIds.has(deployment.id)
            return (
              <React.Fragment key={deployment.id}>
                <tr className={`border-b border-white/10 hover:bg-surface-light transition-smooth ${isSelected ? "bg-purple-600/10" : ""}`}>
                  {showBulkActions && (
                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleSelection(deployment.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label={isSelected ? "Deselect" : "Select"}
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-purple-400" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </td>
                  )}
                  <td className="py-4 px-4 text-text font-medium">{deployment.repo}</td>
                  <td className="py-4 px-4 text-text-secondary">{deployment.branch}</td>
                  <td className="py-4 px-4">
                    <StatusPill status={deployment.status as "success" | "running" | "failed" | "pending"} />
                  </td>
                  <td className="py-4 px-4 text-text-secondary">{deployment.deployedAt}</td>
                  <td className="py-4 px-4">
                    {deployment.url ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={deployment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent/80 text-xs font-mono truncate max-w-[200px]"
                          title={deployment.url}
                        >
                          {deployment.url}
                        </a>
                        <button
                          onClick={() => copyToClipboard(deployment.url!)}
                          className="text-text-secondary hover:text-text transition-colors"
                          title="Copy URL"
                        >
                          <Copy size={14} />
                        </button>
                        <a
                          href={deployment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-secondary hover:text-text transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    ) : (
                      <span className="text-text-secondary text-xs">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 relative">
                      <button
                        onClick={() => onViewLogs(deployment.id)}
                        className="p-1.5 hover:bg-surface rounded-lg transition-smooth text-text-secondary hover:text-text"
                        title="View logs"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {/* Actions Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === deployment.id ? null : deployment.id)}
                          className="p-1.5 hover:bg-surface rounded-lg transition-smooth text-text-secondary hover:text-text"
                          title="More actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {openDropdown === deployment.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-lg shadow-xl z-10">
                            {deployment.url && (
                              <a
                                href={deployment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <ExternalLink size={14} />
                                Open URL
                              </a>
                            )}
                            <button
                              onClick={() => {
                                onViewLogs(deployment.id)
                                setOpenDropdown(null)
                              }}
                              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                              <Eye size={14} />
                              View Logs
                            </button>
                            {canRedeploy && onRedeploy && (
                              <button
                                onClick={() => {
                                  onRedeploy(deployment.id)
                                  setOpenDropdown(null)
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                              >
                                <RefreshCw size={14} />
                                Redeploy
                              </button>
                            )}
                            {canDelete && onDelete && (
                              <button
                                onClick={() => {
                                  onDelete(deployment.id)
                                  setOpenDropdown(null)
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border-t border-white/10"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
