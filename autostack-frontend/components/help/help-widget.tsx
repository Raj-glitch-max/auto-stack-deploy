"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HelpCircle, X, Book, MessageCircle, Mail, ExternalLink } from "lucide-react"
import Link from "next/link"

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false)

  const helpItems = [
    {
      icon: <Book size={18} />,
      label: "Documentation",
      href: "/docs",
      description: "Read the full documentation",
    },
    {
      icon: <MessageCircle size={18} />,
      label: "Support",
      href: "mailto:support@autostack.dev",
      description: "Get help from our team",
    },
    {
      icon: <ExternalLink size={18} />,
      label: "GitHub",
      href: "https://github.com",
      description: "View source code",
      external: true,
    },
  ]

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40"
        aria-label="Help"
      >
        <HelpCircle size={24} />
      </button>

      {/* Help Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-24 right-6 w-80 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Help & Support</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-2">
                {helpItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="text-gray-400 group-hover:text-purple-400 transition-colors">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

