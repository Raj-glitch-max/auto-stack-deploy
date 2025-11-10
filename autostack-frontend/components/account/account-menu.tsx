"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { User, Settings, LogOut, Github, CheckCircle2, XCircle } from "lucide-react"
import api from "@/lib/api"

interface UserData {
  id: string
  email: string
  created_at: string
  github_username?: string
}

export function AccountMenu() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (typeof window === "undefined") return
      const token = localStorage.getItem("access_token")
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const res = await api.get("/me")
        setUser(res.data)
      } catch (err) {
        console.error("Error fetching user:", err)
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    ;(globalThis as any)._AS_ACCESS_TOKEN = null
    ;(globalThis as any)._AS_REFRESH_TOKEN = null
    setUser(null)
    setIsOpen(false)
    router.push("/login")
  }

  const handleConnectGitHub = () => {
    // Use existing GitHub OAuth flow
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/github`
  }

  const handleDisconnectGitHub = () => {
    // This would call a disconnect endpoint if it exists
    // For now, show a tooltip that it's coming soon
    alert("Disconnect feature coming soon!")
  }

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  if (isLoading || !user) return null

  const hasGitHub = !!user.github_username

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        aria-label="Account menu"
        aria-expanded={isOpen}
      >
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-sm font-medium text-white ring-2 ring-transparent hover:ring-purple-500/50 transition-all">
            {getInitials(user.email)}
          </div>
          {/* GitHub status indicator */}
          {hasGitHub && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0a0a0f]"
              aria-label="GitHub connected"
            />
          )}
          {!hasGitHub && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 rounded-full border-2 border-[#0a0a0f]"
              aria-label="GitHub not connected"
            />
          )}
        </div>
        <span className="hidden md:block">{user.email}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-white">{user.email}</p>
              {user.github_username && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Github size={12} />
                  @{user.github_username}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  router.push("/profile")
                  setIsOpen(false)
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <User size={16} />
                Profile
              </button>
              <button
                onClick={() => {
                  setIsSheetOpen(true)
                  setIsOpen(false)
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Github size={16} />
                Connected Accounts
              </button>
              <button
                onClick={() => {
                  router.push("/settings")
                  setIsOpen(false)
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings size={16} />
                Settings
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-white/10 py-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connected Accounts Sheet */}
      <AnimatePresence>
        {isSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsSheetOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111] border border-white/10 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Connected Accounts</h2>
                <button
                  onClick={() => setIsSheetOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* GitHub Connection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Github size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">GitHub</p>
                      {hasGitHub ? (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <CheckCircle2 size={12} className="text-green-400" />
                          Connected as @{user.github_username}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <XCircle size={12} className="text-gray-400" />
                          Not connected
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasGitHub ? (
                      <button
                        onClick={handleDisconnectGitHub}
                        disabled
                        className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-gray-400 hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Coming soon"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectGitHub}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-medium text-white transition"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {hasGitHub && (
                  <button
                    onClick={handleConnectGitHub}
                    className="w-full px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition text-sm font-medium text-gray-300"
                  >
                    Connect Another Account
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
