"use client"

import { useState } from "react"
import api from "@/lib/api"
import Link from "next/link"

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" })
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      const data = new FormData()
      data.append("username", form.email)
      data.append("password", form.password)

      const res = await api.post("/login", data, { withCredentials: true })

      // store access token temporarily
      localStorage.setItem("token", res.data.access_token)

      setMessage("Login successful! Redirecting...")
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1000)
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white px-4">
      <div className="w-full max-w-md bg-[#111]/80 backdrop-blur rounded-xl border border-white/10 p-8">
        <h1 className="text-3xl font-semibold text-center mb-6">Welcome back 👋</h1>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Sign in to your <span className="text-purple-400 font-medium">AutoStack</span> account
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="email"
              placeholder="Email address"
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-purple-600 to-pink-500 py-2 rounded-md font-medium text-sm hover:opacity-90 transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {message && (
          <p
            className={`text-center text-sm mt-4 ${
              message.toLowerCase().includes("success")
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-center text-sm text-gray-400 mt-6">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-purple-400 hover:text-purple-300 transition">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

