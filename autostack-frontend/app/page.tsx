"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"

export default function HomePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is already authenticated
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("access_token")
      setIsAuthenticated(!!token)
    }
  }, [])

  const handleGetStarted = (e: React.MouseEvent) => {
    if (isAuthenticated) {
      e.preventDefault()
      router.push("/deploy")
    }
    // If not authenticated, let the link navigate to /signup
  }

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

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mt-4 mb-6 leading-tight px-4">
          Deploy from <span className="text-purple-500">GitHub</span> to <span className="text-pink-500">AWS</span> in Seconds
        </h1>

        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 px-4">
          Enterprise-grade DevOps automation with Docker, Jenkins, and Terraform — no manual setup, no DevOps experience required.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={isAuthenticated ? "/deploy" : "/signup"}
            onClick={handleGetStarted}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-md font-medium hover:opacity-90 transition"
          >
            {isAuthenticated ? "Deploy Now" : "Get Started Free"}
          </Link>
          <Link
            href="/docs"
            className="px-6 py-3 border border-white/20 rounded-md font-medium hover:bg-white/10 transition"
          >
            View Documentation
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
          <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-0">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="whitespace-nowrap">Auto-scaling</span>
          </span>
          <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-0">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="whitespace-nowrap">Real-time Monitoring</span>
          </span>
          <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-0">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="whitespace-nowrap">One-click Rollback</span>
          </span>
          <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-0">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="whitespace-nowrap">Zero Downtime</span>
          </span>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-32 max-w-6xl mx-auto px-6"
      >
        <div className="text-center mb-12 sm:mb-16 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Everything you need to deploy faster</h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Powerful features built for modern development teams
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-4">
          {[
            {
              icon: "🚀",
              title: "Instant Deployments",
              description: "Deploy your applications in seconds with one-click deployment from GitHub.",
            },
            {
              icon: "📊",
              title: "Real-time Monitoring",
              description: "Monitor CPU, memory, and performance metrics in real-time with beautiful dashboards.",
            },
            {
              icon: "🔔",
              title: "Smart Alerts",
              description: "Get notified instantly when deployments fail or system metrics exceed thresholds.",
            },
            {
              icon: "🔄",
              title: "Auto-scaling",
              description: "Automatically scale your infrastructure based on traffic and demand.",
            },
            {
              icon: "🔒",
              title: "Secure by Default",
              description: "Enterprise-grade security with encrypted connections and secure authentication.",
            },
            {
              icon: "⚡",
              title: "Lightning Fast",
              description: "Built for speed with optimized builds and CDN delivery worldwide.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="mt-20 sm:mt-32 max-w-4xl mx-auto px-4 sm:px-6 text-center"
      >
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 sm:p-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-8">
            Join thousands of developers deploying with AutoStack
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link
              href={isAuthenticated ? "/deploy" : "/signup"}
              onClick={handleGetStarted}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-md font-medium hover:opacity-90 transition text-base sm:text-lg"
            >
              {isAuthenticated ? "Deploy Now" : "Start Free Trial"}
            </Link>
            <Link
              href="/pricing"
              className="px-6 sm:px-8 py-2.5 sm:py-3 border border-white/20 rounded-md font-medium hover:bg-white/10 transition text-base sm:text-lg"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </motion.div>
      </div>
    </>
  )
}

