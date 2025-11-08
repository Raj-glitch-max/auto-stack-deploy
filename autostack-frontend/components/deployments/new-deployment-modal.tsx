"use client"

import { type FormEvent, useState } from "react"
import { Modal } from "@/components/ui/modal"

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

export function NewDeploymentModal({ isOpen, onClose, onDeploy }: NewDeploymentModalProps) {
  const [formData, setFormData] = useState<DeploymentData>({
    repoUrl: "",
    branch: "main",
    environment: "production",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    onDeploy(formData)
    setFormData({ repoUrl: "", branch: "main", environment: "production" })
    setLoading(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deploy New App">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">GitHub Repository URL</label>
          <input
            type="url"
            required
            placeholder="https://github.com/username/repo"
            value={formData.repoUrl}
            onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
            className="w-full bg-surface text-text border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition-smooth"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Branch</label>
          <input
            type="text"
            placeholder="main"
            value={formData.branch}
            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            className="w-full bg-surface text-text border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition-smooth"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Environment</label>
          <select
            value={formData.environment}
            onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
            className="w-full bg-surface text-text border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition-smooth"
          >
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent/90 text-background font-medium py-2 rounded-lg transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Deploying..." : "Deploy Now"}
        </button>
      </form>
    </Modal>
  )
}
