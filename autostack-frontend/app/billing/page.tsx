"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CheckCircle2, CreditCard, Receipt, Calendar, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Plan {
  id: string
  name: string
  price: number
  interval: "month" | "year"
  features: string[]
  popular?: boolean
}

interface Subscription {
  plan: string
  status: "active" | "canceled" | "past_due" | "trialing"
  current_period_end: string
  cancel_at_period_end: boolean
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Starter",
    price: 0,
    interval: "month",
    features: [
      "1 Active Deployment",
      "Basic Metrics",
      "Community Support",
      "5GB Storage",
      "Standard Build Times",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 15,
    interval: "month",
    popular: true,
    features: [
      "5 Active Deployments",
      "Advanced Monitoring",
      "Priority Support",
      "50GB Storage",
      "Faster Build Times",
      "Slack/Discord Alerts",
      "Custom Domains",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0,
    interval: "month",
    features: [
      "Unlimited Deployments",
      "Dedicated Infrastructure",
      "24/7 SLA Support",
      "Unlimited Storage",
      "Custom Build Times",
      "Advanced Security",
      "Team Collaboration",
      "Custom Integrations",
    ],
  },
]

export default function BillingPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") return
      const token = localStorage.getItem("access_token")
      if (!token) {
        router.push("/login")
        return
      }
      fetchSubscription()
    }

    checkAuth()
  }, [router])

  const fetchSubscription = async () => {
    try {
      // This would call a real subscription endpoint
      // For now, we'll simulate it
      setSubscription({
        plan: "free",
        status: "active",
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
      })
    } catch (err) {
      console.error("Error fetching subscription:", err)
      toast.error("Failed to load subscription information")
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setSelectedPlan(planId)
    try {
      // This would call a real upgrade endpoint
      toast.success("Upgrade initiated. Redirecting to payment...")
      // Simulate redirect
      setTimeout(() => {
        toast.info("Payment integration coming soon!")
        setSelectedPlan(null)
      }, 2000)
    } catch (err) {
      console.error("Error upgrading:", err)
      toast.error("Failed to initiate upgrade")
      setSelectedPlan(null)
    }
  }

  const handleCancel = async () => {
    try {
      // This would call a real cancel endpoint
      toast.success("Subscription will be canceled at the end of the billing period")
      setSubscription((prev) =>
        prev ? { ...prev, cancel_at_period_end: true } : null
      )
    } catch (err) {
      console.error("Error canceling subscription:", err)
      toast.error("Failed to cancel subscription")
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-black text-white px-6 pt-10">
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs items={[{ label: "Billing" }]} />
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
          </div>
        </div>
      </>
    )
  }

  const currentPlan = plans.find((p) => p.id === subscription?.plan) || plans[0]

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black text-white px-4 sm:px-6 pt-10 pb-20">
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs items={[{ label: "Billing" }]} />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <h1 className="text-3xl font-semibold mb-2">Billing & Subscription</h1>
            <p className="text-gray-400 text-sm">
              Manage your subscription and billing information
            </p>
          </motion.div>

          {/* Current Plan */}
          {subscription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-10"
            >
              <div className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold">{currentPlan.name}</span>
                      {currentPlan.price === 0 ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                          Free
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          ${currentPlan.price}/{currentPlan.interval === "month" ? "mo" : "yr"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-1">Status</p>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        subscription.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : subscription.status === "trialing"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {subscription.status === "active"
                        ? "Active"
                        : subscription.status === "trialing"
                        ? "Trial"
                        : "Canceled"}
                    </span>
                  </div>
                </div>

                {subscription.cancel_at_period_end && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-400 mb-1">
                        Subscription will cancel
                      </p>
                      <p className="text-xs text-gray-400">
                        Your subscription will be canceled on{" "}
                        {new Date(subscription.current_period_end).toLocaleDateString()}. You'll
                        continue to have access until then.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={16} />
                    <span>
                      Renews on{" "}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                  {subscription.status === "active" && !subscription.cancel_at_period_end && (
                    <button
                      onClick={handleCancel}
                      className="ml-auto px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Available Plans */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-xl sm:text-2xl font-semibold mb-6">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {plans.map((plan, index) => {
                const isCurrentPlan = subscription?.plan === plan.id
                const isEnterprise = plan.id === "enterprise"

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    className={`relative bg-[#111]/70 backdrop-blur border rounded-xl p-6 ${
                      plan.popular
                        ? "border-purple-500/50 ring-2 ring-purple-500/20"
                        : "border-white/10"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 rounded-full text-xs font-medium text-white">
                        Most Popular
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                      <div className="flex items-baseline gap-2 mb-4">
                        {plan.price === 0 ? (
                          <span className="text-3xl font-bold">Free</span>
                        ) : (
                          <>
                            <span className="text-3xl font-bold">${plan.price}</span>
                            <span className="text-gray-400">
                              /{plan.interval === "month" ? "mo" : "yr"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2">
                          <CheckCircle2
                            size={16}
                            className="text-green-400 flex-shrink-0 mt-0.5"
                          />
                          <span className="text-sm text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm font-medium cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : isEnterprise ? (
                      <button
                        onClick={() => router.push("/contact")}
                        className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition text-white text-sm font-medium"
                      >
                        Contact Sales
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={selectedPlan === plan.id}
                        className="w-full px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {selectedPlan === plan.id ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard size={16} />
                            {plan.price === 0 ? "Downgrade" : "Upgrade"}
                          </>
                        )}
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Payment Method */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10"
          >
            <div className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Payment Method</h2>
                <button className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-gray-300">
                  Update
                </button>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <CreditCard size={20} />
                <span className="text-sm">No payment method on file</span>
              </div>
            </div>
          </motion.div>

          {/* Billing History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10"
          >
            <div className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Billing History</h2>
                <button className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Receipt size={16} />
                  View All
                </button>
              </div>
              <div className="text-center py-8 text-gray-400 text-sm">
                No billing history available
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}

