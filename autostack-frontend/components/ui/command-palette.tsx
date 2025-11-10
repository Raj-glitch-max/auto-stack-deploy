"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Search, FileText, Settings, User, LogOut, LayoutDashboard, Rocket, Bell, HelpCircle, Command, CreditCard } from "lucide-react"

interface Command {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  keywords: string[]
  category: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const commands: Command[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: <LayoutDashboard size={18} />,
      action: () => {
        router.push("/dashboard")
        onClose()
      },
      keywords: ["dashboard", "home", "main"],
      category: "Navigation",
    },
    {
      id: "deploy",
      label: "Deploy Project",
      icon: <Rocket size={18} />,
      action: () => {
        router.push("/deploy")
        onClose()
      },
      keywords: ["deploy", "deployment", "new", "create"],
      category: "Actions",
    },
    {
      id: "deployments",
      label: "View Deployments",
      icon: <FileText size={18} />,
      action: () => {
        router.push("/deployments")
        onClose()
      },
      keywords: ["deployments", "list", "projects"],
      category: "Navigation",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
      action: () => {
        router.push("/settings")
        onClose()
      },
      keywords: ["settings", "preferences", "config"],
      category: "Navigation",
    },
    {
      id: "profile",
      label: "Profile",
      icon: <User size={18} />,
      action: () => {
        router.push("/profile")
        onClose()
      },
      keywords: ["profile", "account", "user"],
      category: "Navigation",
    },
    {
      id: "alerts",
      label: "Alerts",
      icon: <Bell size={18} />,
      action: () => {
        router.push("/alerts")
        onClose()
      },
      keywords: ["alerts", "notifications", "warnings"],
      category: "Navigation",
    },
    {
      id: "docs",
      label: "Documentation",
      icon: <HelpCircle size={18} />,
      action: () => {
        router.push("/docs")
        onClose()
      },
      keywords: ["docs", "documentation", "help", "guide"],
      category: "Navigation",
    },
    {
      id: "changelog",
      label: "Changelog",
      icon: <FileText size={18} />,
      action: () => {
        router.push("/changelog")
        onClose()
      },
      keywords: ["changelog", "updates", "whats new", "version"],
      category: "Navigation",
    },
    {
      id: "billing",
      label: "Billing & Subscription",
      icon: <CreditCard size={18} />,
      action: () => {
        router.push("/billing")
        onClose()
      },
      keywords: ["billing", "subscription", "payment", "plan", "pricing"],
      category: "Navigation",
    },
  ]

  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase()
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.keywords.some((kw) => kw.toLowerCase().includes(searchLower)) ||
      cmd.category.toLowerCase().includes(searchLower)
    )
  })

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = []
    }
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, Command[]>)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setSearch("")
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault()
        filteredCommands[selectedIndex].action()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center pt-[20vh] px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <Search size={20} className="text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
              autoComplete="off"
            />
            <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-xs text-gray-400">
              <Command size={12} />
              <span>K</span>
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto" ref={listRef}>
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-400 text-sm">
                No commands found
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {category}
                  </div>
                  {cmds.map((cmd, index) => {
                    const globalIndex = filteredCommands.indexOf(cmd)
                    const isSelected = globalIndex === selectedIndex
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isSelected
                            ? "bg-purple-600/20 text-white"
                            : "text-gray-300 hover:bg-white/5"
                        }`}
                      >
                        <div className="text-gray-400">{cmd.icon}</div>
                        <span className="flex-1 text-left">{cmd.label}</span>
                        {isSelected && (
                          <span className="text-xs text-gray-500">Press Enter</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-xs">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-xs">↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-xs">Enter</kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-xs">Esc</kbd>
                <span>Close</span>
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

