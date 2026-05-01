import { Globe, Brain, Code2, Layers, Smartphone, Download } from "lucide-react"

const FEATURES = [
  {
    icon: Globe,
    title: "Intelligent DOM Scraper",
    description:
      "Playwright visits your URL, strips noise, and extracts a clean semantic HTML tree with colors, fonts, and layout intent.",
  },
  {
    icon: Brain,
    title: "Gemini AI Mapper",
    description:
      "A precision-tuned prompt sends your DOM to Gemini, which maps every element to a typed native UI component with zero hallucinations.",
  },
  {
    icon: Code2,
    title: "AST Code Generator",
    description:
      "The JSON schema is compiled into proper React Native TSX files using AST manipulation — not naive string templates.",
  },
  {
    icon: Layers,
    title: "Strict JSON Schema",
    description:
      "Every generated app conforms to a typed App Schema with Screens, Layouts, Cards, Buttons, and Navigation stacks.",
  },
  {
    icon: Smartphone,
    title: "Expo-First Output",
    description:
      "Output is a ready-to-run Expo project. Open it instantly in Expo Go or build an IPA/APK without any configuration.",
  },
  {
    icon: Download,
    title: "One-Click Export",
    description:
      "Download a ZIP, push directly to GitHub, or open in Expo Snack for live preview — all from the dashboard.",
  },
]

const HOW_IT_WORKS = [
  { step: "01", title: "Paste your URL",         desc: "Drop any public website URL into the input field." },
  { step: "02", title: "AI scans & understands", desc: "Playwright + Gemini parse the DOM and infer your design intent." },
  { step: "03", title: "Schema is generated",    desc: "A strict typed JSON schema is built from your site&apos;s components." },
  { step: "04", title: "Download your app",      desc: "Get a complete Expo React Native project, ready to ship." },
]

export function FeaturesSection() {
  return (
    <>
      {/* Features grid */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">What&apos;s inside</p>
          <h2 className="text-3xl md:text-4xl font-bold text-balance">
            Everything the pipeline needs
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-balance leading-relaxed">
            Each part of the stack was designed to handle the messiness of real websites and produce clean, maintainable mobile code.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">The pipeline</p>
          <h2 className="text-3xl md:text-4xl font-bold text-balance">How it works</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((s, idx) => (
            <div key={s.step} className="relative flex flex-col gap-3">
              {idx < HOW_IT_WORKS.length - 1 && (
                <div
                  aria-hidden
                  className="hidden lg:block absolute top-5 left-[calc(100%+12px)] w-[calc(100%-24px)] h-px bg-border"
                />
              )}
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{s.step}</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p
                className="text-xs text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: s.desc }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-24">
        <div className="relative rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden p-10 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div
              className="w-96 h-96 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, oklch(0.60 0.22 264) 0%, transparent 70%)" }}
            />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-balance">
              Ready to go native?
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm text-balance leading-relaxed">
              Nativify is in public beta. Try it free — no credit card required.
            </p>
            <a
              href="#convert"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Convert your first app
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Nativify</span>
          <span>Built on Playwright &middot; Gemini AI &middot; Expo &middot; React Native</span>
          <span>&copy; {new Date().getFullYear()} Nativify. All rights reserved.</span>
        </div>
      </footer>
    </>
  )
}
