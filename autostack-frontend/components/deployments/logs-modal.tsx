"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface LogModalProps {
  isOpen: boolean
  onClose: () => void
  repo: string
  status: string
}

export function LogModal({ isOpen, onClose, repo, status }: LogModalProps) {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    if (!isOpen) return
    setLogs([])
    let count = 0

    const fakeLogs = [
      "🚀 Starting deployment...",
      "🔍 Checking repository...",
      "📦 Building Docker image...",
      "☁️ Pushing to registry...",
      "⚙️ Provisioning infrastructure via Terraform...",
      "🧩 Deploying services...",
      "✅ Deployment completed successfully!"
    ]

    const interval = setInterval(() => {
      if (count < fakeLogs.length) {
        setLogs((prev) => [...prev, fakeLogs[count]])
        count++
      } else {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-[#111] border border-white/10 rounded-xl p-6 w-full max-w-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Logs — {repo}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="h-64 overflow-y-auto bg-[#0a0a0f] border border-white/10 rounded-lg p-3 text-sm font-mono text-gray-300">
          {logs.map((line, idx) => (
            <p key={idx} className="mb-1">{line}</p>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-white/10 hover:bg-white/10 transition text-sm">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

