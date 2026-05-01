"use client"

import { useState } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroProps {
  onConvert: (url: string) => void
}

export function Hero({ onConvert }: HeroProps) {
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onConvert(url.trim())
    }
  }

  return (
    <section className="relative flex flex-col items-center justify-center min-h-[90vh] pt-14 px-6 overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.60 0.22 264) 0%, transparent 70%)" }}
        />
      </div>

      {/* Grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "linear-gradient(oklch(0.60 0.22 264) 1px, transparent 1px), linear-gradient(90deg, oklch(0.60 0.22 264) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto gap-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-powered web-to-native conversion</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance leading-[1.05]">
          Your website.{" "}
          <span className="text-primary">
            Now native.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground text-balance leading-relaxed max-w-2xl">
          Paste any URL. Our AI scans the DOM, maps every component to its native equivalent,
          and generates a production-ready React Native app in seconds.
        </p>

        {/* URL input */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl flex flex-col sm:flex-row items-stretch gap-3 mt-2"
          aria-label="Convert website to app"
        >
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
            required
            className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all"
          />
          <Button
            type="submit"
            size="lg"
            className="bg-primary text-primary-foreground hover:opacity-90 font-semibold px-6 shrink-0 flex items-center gap-2"
          >
            Convert to App
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">
          No account needed. Free to try. &mdash; Used by <span className="text-foreground font-medium">12,000+</span> developers.
        </p>

        {/* Social proof logos */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mt-4 opacity-40">
          {["Stripe", "Linear", "Notion", "Vercel", "Figma"].map((brand) => (
            <span key={brand} className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
