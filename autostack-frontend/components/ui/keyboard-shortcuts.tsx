"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Command } from "lucide-react"

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const shortcuts: Shortcut[] = [
  {
    keys: ["Cmd", "K"],
    description: "Open command palette",
    category: "General",
  },
  {
    keys: ["G", "D"],
    description: "Go to Dashboard",
    category: "Navigation",
  },
  {
    keys: ["G", "P"],
    description: "Go to Deploy",
    category: "Navigation",
  },
  {
    keys: ["G", "S"],
    description: "Go to Settings",
    category: "Navigation",
  },
  {
    keys: ["/"],
    description: "Focus search",
    category: "General",
  },
  {
    keys: ["Esc"],
    description: "Close modal/dialog",
    category: "General",
  },
  {
    keys: ["?"],
    description: "Show keyboard shortcuts",
    category: "General",
  },
]

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#111] border border-white/10 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-400">Speed up your workflow with these shortcuts</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {items.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm text-gray-300">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <div key={keyIndex} className="flex items-center gap-1">
                            {keyIndex > 0 && (
                              <span className="text-gray-500 text-xs">+</span>
                            )}
                            <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-gray-300 font-mono">
                              {key === "Cmd" ? (
                                <span className="flex items-center gap-1">
                                  <Command size={12} />
                                  K
                                </span>
                              ) : (
                                key
                              )}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 text-xs text-gray-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded">Esc</kbd> to close
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

