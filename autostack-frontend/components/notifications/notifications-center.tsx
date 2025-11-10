"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, X, CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react"
import api from "@/lib/api"

interface Notification {
  id: string
  type: "success" | "error" | "info" | "warning"
  title: string
  message: string
  timestamp: string
  read: boolean
}

interface NotificationsCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsCenter({ isOpen, onClose }: NotificationsCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      // Fetch alerts which serve as notifications
      const res = await api.get("/alerts?resolved=false")
      const alerts = res.data || []
      
      // Transform alerts to notifications
      const transformed = alerts.map((alert: any) => ({
        id: alert.id,
        type: alert.severity === "critical" ? "error" : alert.severity === "warning" ? "warning" : "info",
        title: alert.severity === "critical" ? "Critical Alert" : alert.severity === "warning" ? "Warning" : "Info",
        message: alert.message,
        timestamp: alert.created_at,
        read: alert.resolved || false,
      }))
      
      setNotifications(transformed)
    } catch (err) {
      console.error("Error fetching notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/alerts/${id}`, { resolved: true })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={18} className="text-green-400" />
      case "error":
        return <XCircle size={18} className="text-red-400" />
      case "warning":
        return <AlertCircle size={18} className="text-yellow-400" />
      case "info":
      default:
        return <Info size={18} className="text-blue-400" />
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#111] border-l border-white/10 flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-400 mt-1">{unreadCount} unread</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bell size={48} className="text-gray-600 mb-4" />
                <p className="text-gray-400">No notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      notification.read
                        ? "bg-white/5 border-white/10"
                        : "bg-purple-600/10 border-purple-500/30"
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-white">{notification.title}</h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

