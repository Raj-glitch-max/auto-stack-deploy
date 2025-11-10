"use client"

import { Search, Bell, User } from "lucide-react"

export function Navbar() {
  return (
    <nav className="fixed top-0 right-0 left-0 md:left-64 h-16 glass flex items-center justify-between px-6 z-30 border-b border-white/10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Search deployments..."
            className="bg-surface-light text-text text-sm px-10 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-accent transition-smooth placeholder-text-secondary w-72"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-accent-soft rounded-lg transition-smooth relative">
          <Bell size={20} className="text-text" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
        </button>
        <button className="p-2 hover:bg-accent-soft rounded-lg transition-smooth">
          <User size={20} className="text-text" />
        </button>
      </div>
    </nav>
  )
}

