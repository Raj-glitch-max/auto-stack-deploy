"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16 pb-16 md:pb-0">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-6 bg-background">{children}</main>
      </div>
    </div>
  )
}
