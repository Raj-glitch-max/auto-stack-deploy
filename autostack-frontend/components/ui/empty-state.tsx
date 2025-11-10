"use client"

import { ReactNode } from "react"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  primaryCta?: {
    label: string
    onClick: () => void
  }
  secondaryCta?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon,
  title,
  description,
  primaryCta,
  secondaryCta,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {/* Icon */}
      {icon && (
        <div className="mb-6 text-gray-500" aria-hidden="true">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>

      {/* Description */}
      <p className="text-gray-400 text-sm max-w-md mb-8">{description}</p>

      {/* CTAs */}
      {(primaryCta || secondaryCta) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {primaryCta && (
            <button
              onClick={primaryCta.onClick}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition text-sm font-medium text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              {primaryCta.label}
            </button>
          )}
          {secondaryCta && (
            <button
              onClick={secondaryCta.onClick}
              className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 transition text-sm font-medium text-gray-300"
            >
              {secondaryCta.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
