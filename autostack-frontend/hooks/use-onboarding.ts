"use client"

import { useState, useEffect } from "react"

const ONBOARDING_COMPLETE_KEY = "autostack_onboarding_complete"
const ONBOARDING_DISMISSED_KEY = "autostack_onboarding_dismissed"

export function useOnboarding() {
  const [isComplete, setIsComplete] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const complete = localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true"
    const dismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "true"

    setIsComplete(complete)
    setIsDismissed(dismissed)
    setShouldShow(!complete && !dismissed)
  }, [])

  const markComplete = () => {
    if (typeof window === "undefined") return
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true")
    setIsComplete(true)
    setShouldShow(false)
  }

  const dismiss = () => {
    if (typeof window === "undefined") return
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true")
    setIsDismissed(true)
    setShouldShow(false)
  }

  const reset = () => {
    if (typeof window === "undefined") return
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY)
    localStorage.removeItem(ONBOARDING_DISMISSED_KEY)
    setIsComplete(false)
    setIsDismissed(false)
    setShouldShow(true)
  }

  return {
    isComplete,
    isDismissed,
    shouldShow,
    markComplete,
    dismiss,
    reset,
  }
}

