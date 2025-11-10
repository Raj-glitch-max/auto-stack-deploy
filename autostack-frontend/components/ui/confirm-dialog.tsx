"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  // Focus trap and return focus
  useEffect(() => {
    if (isOpen) {
      const previousActiveElement = document.activeElement as HTMLElement
      
      // Focus the cancel button initially for safety
      setTimeout(() => {
        cancelButtonRef.current?.focus()
      }, 100)

      return () => {
        // Return focus to the trigger element when dialog closes
        previousActiveElement?.focus()
      }
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isConfirming) {
        onClose()
      }
      
      // Tab trap
      if (e.key === "Tab") {
        const focusableElements = [cancelButtonRef.current, confirmButtonRef.current].filter(Boolean)
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, isConfirming, onClose])

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error("Confirm action failed:", error)
    } finally {
      setIsConfirming(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isConfirming) {
            onClose()
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-[#111] border border-white/10 rounded-xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            {danger && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />
              </div>
            )}
            <div className="flex-1">
              <h2 id="dialog-title" className="text-lg font-semibold text-white mb-2">
                {title}
              </h2>
              <p id="dialog-description" className="text-sm text-gray-400">
                {description}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end mt-6">
            <button
              ref={cancelButtonRef}
              onClick={onClose}
              disabled={isConfirming}
              className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition text-sm font-medium text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={handleConfirm}
              disabled={isConfirming}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                danger
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              {isConfirming && (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              )}
              {isConfirming ? "Processing..." : confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
