"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react"

interface TourStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector for element to highlight
  position?: "top" | "bottom" | "left" | "right" | "center"
  action?: () => void // Optional action to perform
}

interface OnboardingTourProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  steps: TourStep[]
}

export function OnboardingTour({ isOpen, onClose, onComplete, steps }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || steps.length === 0) return

    const step = steps[currentStep]
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement
      if (element) {
        setHighlightedElement(element)
        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      } else {
        setHighlightedElement(null)
      }
    } else {
      setHighlightedElement(null)
    }

    // Execute action if provided
    if (step.action) {
      step.action()
    }
  }, [isOpen, currentStep, steps])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setHighlightedElement(null)
    onComplete()
    onClose()
  }

  const handleSkip = () => {
    setHighlightedElement(null)
    onClose()
  }

  if (!isOpen || steps.length === 0) return null

  const step = steps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1

  // Calculate position for tooltip
  const getTooltipPosition = () => {
    if (!highlightedElement || step.position === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        position: "fixed" as const,
      }
    }

    const rect = highlightedElement.getBoundingClientRect()
    const position = step.position || "bottom"
    const scrollY = window.scrollY
    const scrollX = window.scrollX

    switch (position) {
      case "top":
        return {
          top: `${rect.top + scrollY - 20}px`,
          left: `${rect.left + rect.width / 2 + scrollX}px`,
          transform: "translate(-50%, -100%)",
          position: "absolute" as const,
        }
      case "bottom":
        return {
          top: `${rect.bottom + scrollY + 20}px`,
          left: `${rect.left + rect.width / 2 + scrollX}px`,
          transform: "translate(-50%, 0)",
          position: "absolute" as const,
        }
      case "left":
        return {
          top: `${rect.top + rect.height / 2 + scrollY}px`,
          left: `${rect.left + scrollX - 20}px`,
          transform: "translate(-100%, -50%)",
          position: "absolute" as const,
        }
      case "right":
        return {
          top: `${rect.top + rect.height / 2 + scrollY}px`,
          left: `${rect.right + scrollX + 20}px`,
          transform: "translate(0, -50%)",
          position: "absolute" as const,
        }
      default:
        return {
          top: `${rect.bottom + scrollY + 20}px`,
          left: `${rect.left + rect.width / 2 + scrollX}px`,
          transform: "translate(-50%, 0)",
          position: "absolute" as const,
        }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay with hole for highlighted element */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]"
            onClick={handleSkip}
          >
            {highlightedElement && (
              <div
                className="absolute border-2 border-purple-500 rounded-lg shadow-2xl shadow-purple-500/50 pointer-events-none"
                style={{
                  top: highlightedElement.offsetTop - 4,
                  left: highlightedElement.offsetLeft - 4,
                  width: highlightedElement.offsetWidth + 8,
                  height: highlightedElement.offsetHeight + 8,
                }}
              />
            )}
          </motion.div>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="z-[100] w-full max-w-md mx-4"
            style={getTooltipPosition()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#111] border border-purple-500/50 rounded-xl p-6 shadow-2xl mx-4">
              {/* Progress indicator */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${
                        index <= currentStep
                          ? "bg-purple-500 w-6"
                          : "bg-white/10 w-1.5"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  aria-label="Skip tour"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={isFirst}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Skip Tour
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
                  >
                    {isLast ? (
                      <>
                        <CheckCircle2 size={16} />
                        Complete
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

