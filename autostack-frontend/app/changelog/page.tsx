"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

interface ChangelogEntry {
  version: string
  date: string
  type: "feature" | "improvement" | "fix" | "security"
  title: string
  description: string
  items: string[]
}

const changelog: ChangelogEntry[] = [
  {
    version: "2.0.0",
    date: "January 2025",
    type: "feature",
    title: "Major UI/UX Overhaul",
    description: "Complete redesign with modern SaaS features and enhanced user experience",
    items: [
      "Command palette (Cmd+K) for quick navigation",
      "Keyboard shortcuts modal",
      "Enhanced dashboard with analytics charts",
      "Activity feed and deployment timeline",
      "Multi-select and bulk actions",
      "Filters and search functionality",
      "Pagination for large datasets",
      "Export functionality",
      "Notifications center",
      "Help widget",
      "Improved loading states with skeletons",
      "Better error handling with error boundaries",
      "Enhanced accessibility (WCAG AA compliant)",
    ],
  },
  {
    version: "1.5.0",
    date: "November 2024",
    type: "improvement",
    title: "UI/UX Polish Update",
    description: "Added essential UI components and improved user experience",
    items: [
      "Status pills for deployment status",
      "Confirm dialogs for destructive actions",
      "Empty states with CTAs",
      "Logs drawer for real-time log streaming",
      "Account menu with GitHub integration status",
      "Toast notifications with proper micro-copy",
      "Feature flags for upcoming features",
    ],
  },
  {
    version: "1.0.0",
    date: "October 2024",
    type: "feature",
    title: "Initial Release",
    description: "Launch of AutoStack platform with core deployment features",
    items: [
      "GitHub OAuth integration",
      "Google OAuth integration",
      "Docker-based deployments",
      "Real-time deployment logs",
      "System metrics monitoring",
      "Alert system",
      "API key management",
    ],
  },
]

const typeColors = {
  feature: "bg-purple-600/20 text-purple-400 border-purple-500/30",
  improvement: "bg-blue-600/20 text-blue-400 border-blue-500/30",
  fix: "bg-green-600/20 text-green-400 border-green-500/30",
  security: "bg-red-600/20 text-red-400 border-red-500/30",
}

const typeLabels = {
  feature: "Feature",
  improvement: "Improvement",
  fix: "Fix",
  security: "Security",
}

export default function ChangelogPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black text-white px-6 pt-10 pb-20">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: "Changelog" }]} />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <h1 className="text-4xl font-bold">Changelog</h1>
            </div>
            <p className="text-gray-400 text-lg">
              Stay up to date with the latest features, improvements, and fixes
            </p>
          </motion.div>

          {/* Changelog Entries */}
          <div className="space-y-8">
            {changelog.map((entry, index) => (
              <motion.div
                key={entry.version}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold">{entry.version}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColors[entry.type]}`}
                      >
                        {typeLabels[entry.type]}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{entry.date}</p>
                    <h2 className="text-xl font-semibold mb-2">{entry.title}</h2>
                    <p className="text-gray-400">{entry.description}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="mt-6 space-y-2">
                  {entry.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-3">
                      <CheckCircle2
                        size={16}
                        className="text-green-400 mt-0.5 flex-shrink-0"
                      />
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4">Have feedback or suggestions?</h3>
              <p className="text-gray-400 mb-6">
                We'd love to hear from you! Share your ideas and help us improve AutoStack.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/docs"
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                >
                  View Documentation
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="mailto:support@autostack.dev"
                  className="flex items-center gap-2 px-6 py-3 border border-white/20 hover:bg-white/10 rounded-lg font-medium transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}

