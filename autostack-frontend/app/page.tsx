"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col justify-center items-center text-center px-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl"
      >
        <span className="text-purple-400 font-medium tracking-wide text-sm">
          ⚡ Automated CI/CD Pipeline
        </span>

        <h1 className="text-5xl md:text-6xl font-extrabold mt-4 mb-6 leading-tight">
          Deploy from <span className="text-purple-500">GitHub</span> to <span className="text-pink-500">AWS</span> in Seconds
        </h1>

        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
          Enterprise-grade DevOps automation with Docker, Jenkins, and Terraform — no manual setup, no DevOps experience required.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-md font-medium hover:opacity-90 transition"
          >
            Get Started Free
          </Link>
          <Link
            href="/docs"
            className="px-6 py-3 border border-white/20 rounded-md font-medium hover:bg-white/10 transition"
          >
            View Documentation
          </Link>
        </div>

        <div className="mt-10 flex justify-center gap-6 text-sm text-gray-400">
          <span>✅ Auto-scaling Infrastructure</span>
          <span>🔍 Real-time Monitoring</span>
          <span>🌀 One-click Rollback</span>
        </div>
      </motion.div>
      </div>
    </>
  )
}

