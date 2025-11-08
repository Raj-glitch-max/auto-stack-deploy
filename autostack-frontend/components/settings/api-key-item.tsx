"use client"

import { useState } from "react"
import { Eye, EyeOff, Copy, Trash2 } from "lucide-react"

interface ApiKeyItemProps {
  name: string
  keyProp: string
  createdAt: string
}

export function ApiKeyItem({ name, keyProp, createdAt }: ApiKeyItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const safeKey = keyProp || "unknown"
  const displayKey = isVisible
  ? safeKey
  : safeKey.replace(/./g, "•").slice(0, 10) + "..."


  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-light transition-smooth">
      <div className="flex-1">
        <p className="text-sm font-medium text-text">{name}</p>
        <p className="text-xs text-text-secondary mt-1">Created {createdAt}</p>
      </div>

      <div className="flex items-center gap-2">
        <code className="text-xs text-text-secondary font-mono px-2 py-1 bg-background rounded">{displayKey}</code>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="p-1.5 hover:bg-background rounded transition-smooth"
          title={isVisible ? "Hide" : "Show"}
        >
          {isVisible ? (
            <Eye size={16} className="text-text-secondary" />
          ) : (
            <EyeOff size={16} className="text-text-secondary" />
          )}
        </button>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-background rounded transition-smooth"
          title="Copy to clipboard"
        >
          <Copy size={16} className={copied ? "text-success" : "text-text-secondary"} />
        </button>
        <button className="p-1.5 hover:bg-background rounded transition-smooth" title="Delete">
          <Trash2 size={16} className="text-text-secondary hover:text-error" />
        </button>
      </div>
    </div>
  )
}
