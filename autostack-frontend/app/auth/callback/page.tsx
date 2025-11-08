"use client"

export const dynamic = "force-dynamic"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const accessToken = searchParams.get("access_token")
        const refreshToken = searchParams.get("refresh_token")

        if (!accessToken || !refreshToken) {
          setError("Missing tokens in callback")
          return
        }

        // Store tokens
        localStorage.setItem("access_token", accessToken)
        localStorage.setItem("refresh_token", refreshToken)
        
        // Set global tokens
        ;(globalThis as any)._AS_ACCESS_TOKEN = accessToken
        ;(globalThis as any)._AS_REFRESH_TOKEN = refreshToken

        // Fetch user info to get GitHub username
        try {
          const response = await fetch("http://localhost:8000/me", {
            headers: {
              "Authorization": `Bearer ${accessToken}`
            }
          })
          if (response.ok) {
            const userData = await response.json()
            if (userData.github_username) {
              localStorage.setItem("github_username", userData.github_username)
            }
          }
        } catch (err) {
          console.error("Failed to fetch user info:", err)
        }

        // Redirect to deploy page
        setTimeout(() => {
          router.push("/deploy")
        }, 1000)
      } catch (err) {
        console.error("Callback error:", err)
        setError("Failed to process authentication")
      }
    }

    handleCallback()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/deploy")}
            className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-500"
          >
            Back to Deploy
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Connecting GitHub...</h1>
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
