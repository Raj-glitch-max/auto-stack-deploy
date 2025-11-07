"use client"

import { useState } from "react"
import api from "@/lib/api"
import Link from "next/link"

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post("/signup", form)
      setMessage("Account created! Redirecting to login...")
      setTimeout(() => (window.location.href = "/login"), 1500)
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Error creating account")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white px-4">
      <div className="w-full max-w-md bg-[#111]/80 backdrop-blur rounded-xl border border-white/10 p-8">
        <h1 className="text-2xl font-semibold text-center mb-6">Create your account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Name" className="w-full bg-[#0a0a0f] border border-white/10 rounded-md px-4 py-2"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input type="email" placeholder="Email" className="w-full bg-[#0a0a0f] border border-white/10 rounded-md px-4 py-2"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="Password" className="w-full bg-[#0a0a0f] border border-white/10 rounded-md px-4 py-2"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 py-2 rounded-md font-medium hover:opacity-90 transition">
            Sign Up
          </button>
        </form>
        {message && <p className="text-center text-sm text-gray-400 mt-3">{message}</p>}
        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account? <Link href="/login" className="text-purple-400 hover:text-purple-300">Login</Link>
        </p>
      </div>
    </div>
  )
}

