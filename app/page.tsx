"use client"

import { useState, useEffect, useRef } from "react"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { ConversionPipeline, type PipelineStep } from "@/components/conversion-pipeline"
import { MobileSimulator } from "@/components/mobile-simulator"
import { FeaturesSection } from "@/components/features-section"

// Simulated pipeline timing (ms per step)
const STEP_DURATIONS: Record<string, number> = {
  scanning:   2800,
  analyzing:  3200,
  generating: 2600,
  packaging:  1800,
}

const STEP_ORDER: PipelineStep[] = ["scanning", "analyzing", "generating", "packaging", "done"]

export default function Page() {
  const [url, setUrl] = useState<string | null>(null)
  const [step, setStep] = useState<PipelineStep>("idle")
  const simulatorRef = useRef<HTMLDivElement>(null)

  // Advance through steps when a URL is submitted
  useEffect(() => {
    if (!url) return

    let idx = 0
    setStep(STEP_ORDER[0])

    const advance = () => {
      idx++
      if (idx < STEP_ORDER.length) {
        setStep(STEP_ORDER[idx])
        if (STEP_ORDER[idx] !== "done") {
          timer = setTimeout(advance, STEP_DURATIONS[STEP_ORDER[idx]] ?? 2000)
        }
      }
    }

    let timer = setTimeout(advance, STEP_DURATIONS[STEP_ORDER[0]])
    return () => clearTimeout(timer)
  }, [url])

  // Scroll to simulator once conversion is done
  useEffect(() => {
    if (step === "done" && simulatorRef.current) {
      setTimeout(() => {
        simulatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 400)
    }
  }, [step])

  const handleConvert = (submittedUrl: string) => {
    // Normalize URL
    const normalized = submittedUrl.startsWith("http") ? submittedUrl : `https://${submittedUrl}`
    setUrl(normalized)
    setStep("idle")
    // Tiny delay so useEffect picks up the new url
    setTimeout(() => setStep("scanning"), 50)
  }

  const handleReset = () => {
    setUrl(null)
    setStep("idle")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero — shown until a URL is submitted */}
      {!url && <Hero onConvert={handleConvert} />}

      {/* Conversion Pipeline — shown while processing */}
      {url && step !== "done" && (
        <div className="pt-20 flex justify-center">
          <ConversionPipeline url={url} currentStep={step} onReset={handleReset} />
        </div>
      )}

      {/* Mobile Simulator — shown after conversion */}
      {url && step === "done" && (
        <>
          <div className="pt-20" ref={simulatorRef}>
            <div className="flex justify-center mb-8 px-6">
              <ConversionPipeline url={url} currentStep="done" onReset={handleReset} />
            </div>
            <MobileSimulator url={url} />
          </div>
        </>
      )}

      {/* Features + Footer — always shown below the fold */}
      <FeaturesSection />
    </main>
  )
}
