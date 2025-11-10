"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import api from "@/lib/api"
import { Navbar } from "@/components/navbar"

interface User {
  id: string
  email: string
  created_at: string
  github_username?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      if (typeof window === 'undefined') return
      const token = localStorage.getItem("access_token")
      if (!token) {
        router.push("/login")
        return
      }
      
      try {
        const res = await api.get("/me")
        setUser(res.data)
      } catch (err) {
        console.error("Error fetching user:", err)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUser()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-400">
        Loading profile...
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black text-white px-6 pt-24 pb-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <h1 className="text-3xl font-semibold mb-2">Profile</h1>
            <p className="text-gray-400 text-sm">
              Manage your account information and settings
            </p>
          </motion.div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-xl p-8"
          >
            {/* Avatar Section */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/10">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-3xl font-medium text-white">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-1">{user.email}</h2>
                {user.github_username && (
                  <p className="text-gray-400 mb-2">@{user.github_username}</p>
                )}
                <p className="text-sm text-gray-500">
                  Member since {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 px-4 bg-black/30 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-400">Email Address</p>
                      <p className="text-white">{user.email}</p>
                    </div>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 bg-black/30 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-400">User ID</p>
                      <p className="text-white font-mono text-sm">{user.id}</p>
                    </div>
                  </div>

                  {user.github_username && (
                    <div className="flex items-center justify-between py-3 px-4 bg-black/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-400">GitHub</p>
                          <p className="text-white">@{user.github_username}</p>
                        </div>
                      </div>
                      <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">Connected</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => router.push("/settings")}
                    className="flex items-center gap-3 p-4 bg-black/30 hover:bg-black/50 rounded-lg transition-colors text-left"
                  >
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="font-medium">Account Settings</p>
                      <p className="text-xs text-gray-400">Change password, security</p>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-3 p-4 bg-black/30 hover:bg-black/50 rounded-lg transition-colors text-left"
                  >
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <div>
                      <p className="font-medium">Dashboard</p>
                      <p className="text-xs text-gray-400">View deployments</p>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push("/deploy")}
                    className="flex items-center gap-3 p-4 bg-black/30 hover:bg-black/50 rounded-lg transition-colors text-left"
                  >
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div>
                      <p className="font-medium">Deploy Project</p>
                      <p className="text-xs text-gray-400">Create new deployment</p>
                    </div>
                  </button>

                  {!user.github_username && (
                    <button
                      onClick={() => {
                        // TODO: Implement GitHub OAuth flow
                        alert("GitHub OAuth integration coming soon!")
                      }}
                      className="flex items-center gap-3 p-4 bg-black/30 hover:bg-black/50 rounded-lg transition-colors text-left"
                    >
                      <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium">Connect GitHub</p>
                        <p className="text-xs text-gray-400">Link your GitHub account</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
