"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  mobile?: string
  tablet?: string
  desktop?: string
}

export function ResponsiveContainer({
  children,
  className,
  mobile = "px-4",
  tablet = "sm:px-6",
  desktop = "lg:px-8",
}: ResponsiveContainerProps) {
  return (
    <div className={cn("w-full mx-auto max-w-7xl", mobile, tablet, desktop, className)}>
      {children}
    </div>
  )
}

