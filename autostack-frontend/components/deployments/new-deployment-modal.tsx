"use client"

import { type FormEvent, useState, useEffect } from "react"
import { Modal } from "@/components/ui/modal"
import { RepoSelector } from "@/components/RepoSelector"
import api from "@/lib/api"

interface NewDeploymentModalProps {
  isOpen: boolean
  onClose: () => void
  onDeploy: (data: DeploymentData) => void
}

export interface DeploymentData {
  repoUrl: string
  branch: string
  environment: string
}

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

export function NewDeploymentModal({ isOpen, onClose, onDeploy }: NewDeploymentModalProps) {
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [branch, setBranch] = useState<string>("main")
  const [environment, setEnvironment] = useState<string>("production")
  const [useManualUrl, setUseManualUrl] = useState(false)
  const [manualRepoUrl, setManualRepoUrl] = useState("")
  const [loading, setLoading] = useState(false)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedRepo(null)
      setBranch("main")
      setEnvironment("production")
      setUseManualUrl(false)
      setManualRepoUrl("")
    }
  }, [isOpen])

  // Update branch when repo changes
  useEffect(() => {
    if (selectedRepo) {
      setBranch(selectedRepo.default_branch)
    }
  }, [selectedRepo])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let repoUrl = ""
      
      if (useManualUrl) {
        repoUrl = manualRepoUrl
        if (!repoUrl || !repoUrl.trim()) {
          alert("Please enter a repository URL")
          setLoading(false)
          return
        }
      } else {
        if (!selectedRepo) {
          alert("Please select a repository")
          setLoading(false)
          return
        }
        repoUrl = selectedRepo.clone_url
      }

      onDeploy({
        repoUrl,
        branch: branch || "main",
        environment,
      })
    } catch (error) {
      console.error("Deployment error:", error)
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deploy New App">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle between GitHub repos and manual URL */}
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <button
            type="button"
            onClick={() => setUseManualUrl(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
              !useManualUrl
                ? "bg-accent text-background"
                : "bg-surface text-text-secondary hover:bg-surface-light"
            }`}
          >
            GitHub Repository
          </button>
          <button
            type="button"
            onClick={() => setUseManualUrl(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
              useManualUrl
                ? "bg-accent text-background"
                : "bg-surface text-text-secondary hover:bg-surface-light"
            }`}
          >
            Manual URL
          </button>
        </div>

        {useManualUrl ? (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              GitHub Repository URL
            </label>
            <input
              type="url"
              required
              placeholder="https://github.com/username/repo.git"
              value={manualRepoUrl}
              onChange={(e) => setManualRepoUrl(e.target.value)}
              className="w-full bg-surface text-text border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition-smooth"
            />
            <p className="text-xs text-text-secondary mt-1">
              Enter the full GitHub repository URL
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Select Repository
            </label>
            <RepoSelector
              onSelect={setSelectedRepo}
              selectedRepo={selectedRepo}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Branch</label>
          <input
            type="text"
            placeholder={selectedRepo?.default_branch || "main"}
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            required
            className="w-full bg-surface text-text border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition-smooth"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Environment</label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="w-full bg-surface text-text border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition-smooth"
          >
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-400 font-medium mb-1">Deployment Info</p>
          <ul className="text-xs text-text-secondary space-y-1">
            <li>• Auto-detect project type (Node.js, Python, Go, Static)</li>
            <li>• Build Docker image automatically</li>
            <li>• Deploy to available port</li>
            <li>• Get live URL instantly</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-surface hover:bg-surface-light text-text font-medium transition-smooth"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-accent hover:bg-accent/90 text-background font-medium py-2 rounded-lg transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Deploying..." : "Deploy Now"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
