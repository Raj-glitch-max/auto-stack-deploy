"use client"

export function Footer() {
  return (
    <footer className="w-full py-6 text-center text-sm text-text-secondary mt-10 border-t border-border/40">
      © {new Date().getFullYear()} AutoStack. All rights reserved.
    </footer>
  )
}
