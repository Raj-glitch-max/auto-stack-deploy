"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import api from "@/lib/api"
import { AccountMenu } from "@/components/account/account-menu"
import { NotificationsCenter } from "@/components/notifications/notifications-center"
import { Bell } from "lucide-react"

interface User {
  id: string
  email: string
  created_at: string
  github_username?: string
}

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch user data from /me endpoint
  useEffect(() => {
    const fetchUser = async () => {
      if (typeof window === 'undefined') return
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
        // Token might be invalid, clear it
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUser()
  }, [])

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return
      try {
        const res = await api.get("/alerts?resolved=false")
        const alerts = res.data || []
        setUnreadCount(alerts.length)
      } catch (err) {
        console.error("Error fetching unread count:", err)
      }
    }

    if (user) {
      fetchUnreadCount()
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  // Route change loading indicator
  useEffect(() => {
    setIsNavigating(true)
    
    // Hide loading indicator after a short delay
    const timer = setTimeout(() => {
      setIsNavigating(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    ;(globalThis as any)._AS_ACCESS_TOKEN = null
    ;(globalThis as any)._AS_REFRESH_TOKEN = null
    setUser(null)
    router.push("/login")
  }

  return (
    <>
      {/* Route change loading indicator */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-purple-600/20 z-[60]">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>
      )}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AutoStack</span>
            <span className="text-xs text-gray-500">Deploy with Confidence</span>
          </div>
        </Link>

        {/* Nav Links - Desktop */}
        <div className="hidden lg:flex items-center gap-8 text-sm">
          <Link href="/#features" className="text-gray-400 hover:text-white transition-colors">Features</Link>
          <Link href="/how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</Link>
          <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
          <Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Docs</Link>
          <Link href="/changelog" className="text-gray-400 hover:text-white transition-colors">Changelog</Link>
          <Link href="/billing" className="text-gray-400 hover:text-white transition-colors">Billing</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {!isLoading && user ? (
            <>
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              <AccountMenu />
            </>
          ) : !isLoading ? (
            <div className="flex items-center gap-3">
              <Link 
                href="/login" 
                className="hidden sm:block text-gray-400 hover:text-white text-sm transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={(e) => {
                  // If user is authenticated, redirect to /deploy instead
                  if (typeof window !== 'undefined') {
                    const token = localStorage.getItem("access_token")
                    if (token) {
                      e.preventDefault()
                      router.push("/deploy")
                    }
                  }
                }}
                className="px-4 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
              >
                Get Started
              </Link>
            </div>
          ) : null}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-white/10"
        >
          <div className="px-6 py-4 space-y-3">
            <Link href="/#features" className="block text-gray-400 hover:text-white transition-colors">Features</Link>
            <Link href="/how-it-works" className="block text-gray-400 hover:text-white transition-colors">How It Works</Link>
            <Link href="/pricing" className="block text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="block text-gray-400 hover:text-white transition-colors">Docs</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block text-gray-400 hover:text-white transition-colors">Dashboard</Link>
                <Link href="/deploy" className="block text-gray-400 hover:text-white transition-colors">Deploy</Link>
                <Link href="/profile" className="block text-gray-400 hover:text-white transition-colors">Profile</Link>
                <Link href="/settings" className="block text-gray-400 hover:text-white transition-colors">Settings</Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-red-400 hover:text-red-300 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" className="block text-gray-400 hover:text-white transition-colors">Sign In</Link>
            )}
          </div>
        </motion.div>
      )}
      <NotificationsCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </motion.nav>
    </>
  )
}

