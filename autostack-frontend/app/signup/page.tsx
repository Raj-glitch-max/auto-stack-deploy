"use client"

import { useState } from "react"
import api from "@/lib/api"
import Link from "next/link"

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "" })
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      // Backend doesn't accept 'name' field
      const res = await api.post("/signup", {
        email: form.email,
        password: form.password
      })
      setMessage("Account created! Redirecting to login...")
      setTimeout(() => (window.location.href = "/login"), 1500)
    } catch (err: any) {
      console.error("Signup error:", err)
      if (err.response?.data?.detail) {
        setMessage(err.response.data.detail)
      } else if (err.message) {
        setMessage(err.message)
      } else if (err.code === "ECONNREFUSED" || err.code === "ERR_NETWORK") {
        setMessage("Cannot connect to server. Please check if the backend is running.")
      } else {
        setMessage("Error creating account. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white px-4">
      <div className="w-full max-w-md bg-[#111]/80 backdrop-blur rounded-xl border border-white/10 p-8">
        <h1 className="text-2xl font-semibold text-center mb-6">Create your account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full bg-[#0a0a0f] border border-white/10 rounded-md px-4 py-2 focus:outline-none focus:border-purple-500 transition"
            value={form.email} 
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input 
            type="password" 
            placeholder="Password (min 8 characters)" 
            className="w-full bg-[#0a0a0f] border border-white/10 rounded-md px-4 py-2 focus:outline-none focus:border-purple-500 transition"
            value={form.password} 
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-purple-600 to-pink-500 py-2 rounded-md font-medium hover:opacity-90 transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        {message && (
          <p className={`text-center text-sm mt-3 ${
            message.toLowerCase().includes("created") || message.toLowerCase().includes("success")
              ? "text-green-400"
              : "text-red-400"
          }`}>
            {message}
          </p>
        )}
        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account? <Link href="/login" className="text-purple-400 hover:text-purple-300">Login</Link>
        </p>
      </div>
    </div>
  )
}

