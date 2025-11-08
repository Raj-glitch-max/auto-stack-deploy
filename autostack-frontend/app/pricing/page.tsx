"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"

const plans = [
  {
    name: "Starter",
    price: "Free",
    features: ["1 Project", "Basic Metrics", "Community Support"],
  },
  {
    name: "Pro",
    price: "$15/mo",
    features: ["5 Projects", "Advanced Monitoring", "Slack Alerts", "Priority Support"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["Unlimited Projects", "Dedicated Infrastructure", "24/7 SLA Support"],
  },
]

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black text-white flex flex-col items-center px-6 pt-16">
      <h1 className="text-4xl font-bold mb-4">Pricing</h1>
      <p className="text-gray-400 mb-12 text-center max-w-xl">
        Choose a plan that grows with your infrastructure needs. No hidden fees, cancel anytime.
      </p>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            className="border border-white/10 rounded-xl p-8 bg-[#111]/70 backdrop-blur hover:scale-105 transition-transform"
          >
            <h2 className="text-xl font-semibold mb-3">{plan.name}</h2>
            <p className="text-3xl font-bold mb-6">{plan.price}</p>
            <ul className="text-gray-400 text-sm space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f}>✅ {f}</li>
              ))}
            </ul>
            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 py-2 rounded-md font-medium hover:opacity-90 transition">
              Choose Plan
            </button>
          </motion.div>
        ))}
      </div>
      </div>
    </>
  )
}

