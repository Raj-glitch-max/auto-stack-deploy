"use client"

import { AuthProvider } from "@/components/AuthProvider"
import { Footer } from "@/components/layout/footer"
import { TransitionWrapper } from "@/components/layout/transition-wrapper"
import "@/styles/globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <main className="pt-20">
            <TransitionWrapper>{children}</TransitionWrapper>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
