"use client"

import { AuthProvider } from "@/components/AuthProvider"
import { Footer } from "@/components/layout/footer"
import { TransitionWrapper } from "@/components/layout/transition-wrapper"
import { CommandPalette } from "@/components/ui/command-palette"
import { HelpWidget } from "@/components/help/help-widget"
import { KeyboardShortcutsModal } from "@/components/ui/keyboard-shortcuts"
import { useState, useEffect } from "react"
import "@/styles/globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      }
      // ? for keyboard shortcuts
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        // Only trigger if not typing in an input
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault()
          setIsShortcutsOpen(true)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <main className="pt-20">
            <TransitionWrapper>{children}</TransitionWrapper>
          </main>
          <Footer />
          <Toaster position="top-right" theme="dark" richColors />
          <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
          <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
          <HelpWidget />
        </AuthProvider>
      </body>
    </html>
  )
}
