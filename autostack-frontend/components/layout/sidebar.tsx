"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, GitBranch, AlertCircle, Cpu, Settings, ChevronLeft, ChevronRight } from "lucide-react"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Deployments", href: "/deployments", icon: GitBranch },
  { name: "Alerts", href: "/alerts", icon: AlertCircle },
  { name: "Agents", href: "/agents", icon: Cpu },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 h-screen bg-surface border-r border-white/10 flex-col transition-smooth z-40"
      style={{ width: collapsed ? "80px" : "256px" }}
    >
      <div className="flex items-center justify-between px-4 mb-10 pt-6">
        <div className={`font-bold text-xl text-accent tracking-wide ${collapsed ? "hidden" : "block"}`}>
          AutoStack
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-accent-soft rounded-lg transition-smooth"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 space-y-2 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth ${
                isActive
                  ? "bg-accent text-background shadow-[0_0_15px_rgba(0,246,199,0.3)]"
                  : "text-text-secondary hover:bg-accent-soft hover:text-accent"
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              <span className={`${collapsed ? "hidden" : "inline"} transition-smooth`}>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

