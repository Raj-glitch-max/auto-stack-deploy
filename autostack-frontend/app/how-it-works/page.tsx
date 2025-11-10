"use client"

import { motion } from "framer-motion"

const steps = [
  {
    step: 1,
    title: "Connect Your Repo",
    description: "Link your GitHub repository to AutoStack. We automatically detect your stack and Dockerfile.",
  },
  {
    step: 2,
    title: "Configure Pipeline",
    description: "Define environment variables and infrastructure via Terraform or YAML — all in one dashboard.",
  },
  {
    step: 3,
    title: "Deploy Instantly",
    description: "Click ‘Deploy’ — AutoStack provisions, builds, and deploys your app to AWS in seconds.",
  },
  {
    step: 4,
    title: "Monitor & Scale",
    description: "Real-time Prometheus metrics, alerting, and auto-scaling — without any manual setup.",
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 pt-16">
      <h1 className="text-4xl font-bold text-center mb-4">How AutoStack Works</h1>
      <p className="text-gray-400 text-center max-w-xl mx-auto mb-12">
        Your entire CI/CD and monitoring workflow — visualized in one simple pipeline.
      </p>

      <div className="max-w-4xl mx-auto grid gap-8">
        {steps.map((step, i) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border border-white/10 rounded-xl p-6 bg-[#111]/70 backdrop-blur relative overflow-hidden"
          >
            <span className="absolute top-4 right-4 text-purple-400 text-lg font-semibold">
              Step {step.step}
            </span>
            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
            <p className="text-gray-400 text-sm">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

