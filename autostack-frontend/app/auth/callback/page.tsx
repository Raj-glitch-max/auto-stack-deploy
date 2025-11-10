"use client"

export const dynamic = "force-dynamic"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import api from "@/lib/api"
import { useAuth } from "@/components/AuthProvider"
import { toast } from "sonner"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const { setUser } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const accessToken = searchParams.get("access_token")
        const refreshToken = searchParams.get("refresh_token")
        const errorParam = searchParams.get("error")

        // Check for OAuth error
        if (errorParam) {
          console.error("❌ OAuth error:", errorParam)
          const errorMessage = `Authentication failed: ${errorParam}`
          setError(errorMessage)
          toast.error(errorMessage)
          return
        }

        if (!accessToken || !refreshToken) {
          console.error("❌ Missing tokens in callback URL")
          const errorMessage = "Missing authentication tokens. Please try logging in again."
          setError(errorMessage)
          toast.error(errorMessage)
          return
        }

        console.log("🔐 Processing OAuth callback...")

        // Store tokens
        localStorage.setItem("access_token", accessToken)
        localStorage.setItem("refresh_token", refreshToken)
        
        // Set global tokens
        ;(globalThis as any)._AS_ACCESS_TOKEN = accessToken
        ;(globalThis as any)._AS_REFRESH_TOKEN = refreshToken

        console.log("✅ Tokens stored successfully")

        // Fetch user info using API client
        try {
          console.log("👤 Fetching user information...")
          const response = await api.get("/me")
          const userData = response.data
          
          // Update AuthProvider context
          setUser(userData)
          
          // Show success toast
          const userName = userData.email?.split('@')[0] || "there"
          toast.success(`Welcome back, ${userName}.`)
          
          console.log("✅ Google OAuth successful! User:", userData.email)
        } catch (err: any) {
          console.error("❌ Failed to fetch user info:", err)
          console.error("Error details:", {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status
          })
          const errorMessage = "Failed to fetch user information. Please try logging in again."
          setError(errorMessage)
          toast.error(errorMessage)
          
          // Clear invalid tokens
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          ;(globalThis as any)._AS_ACCESS_TOKEN = null
          ;(globalThis as any)._AS_REFRESH_TOKEN = null
          return
        }

        // Redirect to dashboard
        console.log("🎉 Redirecting to dashboard...")
        setTimeout(() => {
          router.push("/dashboard")
        }, 500)
      } catch (err: any) {
        console.error("❌ Callback error:", err)
        setError(`Failed to process authentication: ${err.message || "Unknown error"}`)
      }
    }

    handleCallback()
  }, [searchParams, router, setUser])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
            >
              Back to Login
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Authenticating...</h1>
        <p className="text-gray-400">Please wait while we complete the authentication</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
