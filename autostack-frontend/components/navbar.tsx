"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import { useAuth } from "./AuthProvider"

export function Navbar() {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
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
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-xs font-medium text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span>Dashboard</span>
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-md text-sm font-medium border border-white/20 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                href="/login" 
                className="hidden sm:block text-gray-400 hover:text-white text-sm transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
              >
                Get Started
              </Link>
            </div>
          )}

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
                <button
                  onClick={logout}
                  className="block w-full text-left text-gray-400 hover:text-white transition-colors"
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
    </motion.nav>
  )
}

