"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <Link href="/" className="text-lg font-semibold flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-xs font-bold">
            →
          </div>
          AutoStack
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link href="/#features" className="text-gray-400 hover:text-white">Features</Link>
          <Link href="/how-it-works" className="text-gray-400 hover:text-white">How It Works</Link>
          <Link href="/pricing" className="text-gray-400 hover:text-white">Pricing</Link>
          <Link href="/docs" className="text-gray-400 hover:text-white">Docs</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-400 hover:text-white text-sm">Sign In</Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

