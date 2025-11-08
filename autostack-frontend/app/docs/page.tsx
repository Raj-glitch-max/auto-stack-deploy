"use client"

import { motion } from "framer-motion"

const docsSections = [
  {
    title: "Getting Started",
    content: "Learn how to deploy your first app with AutoStack in minutes. Connect your GitHub repo, configure your environment, and hit Deploy.",
  },
  {
    title: "Configuration",
    content: "Customize deployments using YAML or environment variables. Supports Docker, Node, Python, Go, and static sites.",
  },
  {
    title: "Monitoring",
    content: "Monitor CPU, memory, network, and uptime for every deployment with real-time metrics powered by Prometheus.",
  },
  {
    title: "Integrations",
    content: "Integrate with AWS, GCP, DigitalOcean, or custom VMs using Terraform automation. Slack and Discord alerts supported.",
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row max-w-7xl mx-auto px-6 pt-10 gap-10">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="md:w-64 w-full md:block hidden border-r border-white/10 pr-6"
      >
        <h2 className="text-xl font-semibold mb-6">Docs</h2>
        <ul className="space-y-3 text-gray-400 text-sm">
          {docsSections.map((section) => (
            <li key={section.title} className="hover:text-purple-400 cursor-pointer">
              {section.title}
            </li>
          ))}
        </ul>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex-1 space-y-10"
      >
        {docsSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-2xl font-bold text-purple-400 mb-3">{section.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{section.content}</p>
          </div>
        ))}
      </motion.main>
    </div>
  )
}

