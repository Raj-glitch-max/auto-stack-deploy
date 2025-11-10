"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      setIsDark(savedTheme === "dark")
    }
  }, [])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem("theme", newDark ? "dark" : "light")
    document.documentElement.classList.toggle("dark", newDark)
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-light transition-smooth w-full justify-between"
    >
      <span className="text-sm font-medium text-text">Theme</span>
      <div className="flex items-center gap-2 bg-background/50 px-2 py-1 rounded">
        {isDark ? <Moon size={18} className="text-accent" /> : <Sun size={18} className="text-warning" />}
        <span className="text-xs text-text-secondary">{isDark ? "Dark" : "Light"}</span>
      </div>
    </button>
  )
}
