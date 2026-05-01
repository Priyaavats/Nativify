"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Circle, Loader2, Globe, Brain, Code2, Package } from "lucide-react"
import { cn } from "@/lib/utils"

export type PipelineStep = "idle" | "scanning" | "analyzing" | "generating" | "packaging" | "done"

interface Step {
  id: PipelineStep
  label: string
  description: string
  icon: React.ElementType
}

const STEPS: Step[] = [
  { id: "scanning",   label: "Scanning DOM",      description: "Visiting URL & extracting semantic HTML structure",   icon: Globe  },
  { id: "analyzing",  label: "AI Analysis",        description: "Mapping components to native equivalents via Gemini", icon: Brain  },
  { id: "generating", label: "Code Generation",    description: "Writing React Native TSX from JSON schema",          icon: Code2  },
  { id: "packaging",  label: "Packaging Project",  description: "Bundling Expo template & zipping for download",      icon: Package },
]

const STEP_ORDER: PipelineStep[] = ["scanning", "analyzing", "generating", "packaging", "done"]

interface ConversionPipelineProps {
  url: string
  currentStep: PipelineStep
  onReset: () => void
}

export function ConversionPipeline({ url, currentStep, onReset }: ConversionPipelineProps) {
  const currentIdx = STEP_ORDER.indexOf(currentStep)

  return (
    <section className="w-full max-w-2xl mx-auto px-6 py-10">
      {/* URL being converted */}
      <div className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3 mb-8">
        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground truncate flex-1">{url}</span>
        <button
          onClick={onReset}
          className="text-xs text-primary hover:underline shrink-0"
          aria-label="Change URL"
        >
          Change
        </button>
      </div>

      {/* Steps */}
      <ol className="relative flex flex-col gap-0" aria-label="Conversion pipeline steps">
        {STEPS.map((step, idx) => {
          const stepIdx = STEP_ORDER.indexOf(step.id)
          const isComplete = currentIdx > stepIdx
          const isActive   = currentIdx === stepIdx
          const isPending  = currentIdx < stepIdx

          return (
            <li key={step.id} className="flex gap-4">
              {/* Connector column */}
              <div className="flex flex-col items-center">
                <StepIcon
                  icon={step.icon}
                  isComplete={isComplete}
                  isActive={isActive}
                />
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-px flex-1 my-1 transition-colors duration-500",
                      isComplete ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className={cn("pb-8 pt-0.5", idx === STEPS.length - 1 && "pb-0")}>
                <p className={cn(
                  "text-sm font-semibold leading-5 transition-colors",
                  isComplete && "text-foreground",
                  isActive  && "text-primary",
                  isPending && "text-muted-foreground",
                )}>
                  {step.label}
                </p>
                <p className={cn(
                  "text-xs mt-0.5 leading-relaxed transition-colors",
                  isComplete && "text-muted-foreground",
                  isActive  && "text-muted-foreground",
                  isPending && "text-muted-foreground/50",
                )}>
                  {step.description}
                </p>

                {isActive && (
                  <ProgressBar />
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {currentStep === "done" && (
        <div className="mt-2 p-4 rounded-lg border border-primary/30 bg-primary/5 text-sm text-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span>Conversion complete! Scroll down to preview and download your app.</span>
        </div>
      )}
    </section>
  )
}

function StepIcon({ icon: Icon, isComplete, isActive }: { icon: React.ElementType; isComplete: boolean; isActive: boolean }) {
  if (isComplete) {
    return (
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/40">
        <CheckCircle2 className="w-4 h-4" />
      </span>
    )
  }
  if (isActive) {
    return (
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/40 text-primary">
        <Loader2 className="w-4 h-4 animate-spin" />
      </span>
    )
  }
  return (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted border border-border text-muted-foreground">
      <Icon className="w-4 h-4" />
    </span>
  )
}

function ProgressBar() {
  const [width, setWidth] = useState(5)
  useEffect(() => {
    const id = setInterval(() => setWidth(w => Math.min(w + 3, 90)), 200)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="mt-2 h-1 w-48 max-w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-200"
        style={{ width: `${width}%` }}
        role="progressbar"
        aria-valuenow={width}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}
