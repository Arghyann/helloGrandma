"use client"

import { useEffect, useRef, useState } from "react"
import { FEATURED } from "@/lib/transcripts"
import { OuijaBoard } from "./ouija"
import { CandleReader } from "./candle-reader"
import { Conversation, useInViewOnce } from "./transcript"

// Deterministic so the static export and the client render the same embers.
const EMBERS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 1.7) % 11,
  duration: 12 + ((i * 5) % 9),
  drift: ((i % 5) - 2) * 22,
}))

const RITUAL = [
  { step: "Gather the remains", detail: "~100k message pairs exported from WhatsApp, Signal and Instagram." },
  { step: "Discard the dry ones", detail: "Most of them were “ok” and “lol”. Trimmed to 30k longer messages." },
  { step: "Find the funny", detail: "Kept 1.5k replies that were followed by a laughing emoji." },
  { step: "Perform the rite", detail: "Fine-tuned Qwen 14B for 4 epochs on an NVIDIA L4. About 10 hours on Modal." },
  { step: "Summon", detail: "A small Go API on Render wakes a GPU on Modal whenever someone speaks to it." },
]

function CandleGlow() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine || reduce) return

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 3 }
    const pos = { ...target }
    let frame = 0
    const tick = () => {
      // A light lerp gives the glow some lag, like a flame being carried.
      pos.x += (target.x - pos.x) * 0.1
      pos.y += (target.y - pos.y) * 0.1
      if (ref.current) ref.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      frame = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.5 ? requestAnimationFrame(tick) : 0
    }
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX
      target.y = e.clientY
      setActive(true)
      if (!frame) frame = requestAnimationFrame(tick)
    }
    window.addEventListener("pointermove", onMove)
    return () => {
      window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  return <div ref={ref} className="candle-glow" data-active={active} aria-hidden />
}

function useHauntedTab() {
  useEffect(() => {
    const original = document.title
    const onVisibility = () => {
      document.title = document.hidden ? "come back…" : original
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])
}

// The séance itself is unlinked. Typing its name anywhere on the page opens it.
function useSecretWord(word: string, href: string) {
  useEffect(() => {
    let buffer = ""
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey) return
      buffer = (buffer + e.key.toLowerCase()).slice(-word.length)
      if (buffer === word) window.location.href = href
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [word, href])
}

function Section({ eyebrow, title, children, id }: { eyebrow: string; title: string; children: React.ReactNode; id?: string }) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>(0.2)
  return (
    <section id={id} className="relative z-10 mx-auto w-full max-w-6xl px-4 py-24 sm:px-8 sm:py-32">
      <div ref={ref} data-shown={inView} className="reveal mb-12 text-center sm:mb-16">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.35em] text-[var(--candle)]/80">{eyebrow}</p>
        <h2 className="font-fell mt-3 text-4xl text-[var(--bone)] sm:text-6xl">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Hero() {
  const [start, setStart] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setStart(true), 1400)
    return () => clearTimeout(t)
  }, [])

  return (
    <header className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-24 text-center">
      <div className="haunted-fog" aria-hidden />
      <div className="haunted-fog slow" aria-hidden />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {EMBERS.map((e, i) => (
          <span
            key={i}
            className="ember"
            style={{
              left: `${e.left}%`,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.duration}s`,
              ["--drift" as string]: `${e.drift}px`,
            }}
          />
        ))}
      </div>

      <p className="relative font-mono text-[0.7rem] uppercase tracking-[0.4em] text-white/40">hellograndma.tech · est. beyond the grave</p>
      <h1 className="font-fell flicker relative mt-6 text-6xl leading-[0.95] text-[var(--bone)] sm:text-8xl md:text-9xl">
        Talk to
        <br />
        <span className="italic text-[var(--candle)]">the Dead</span>
      </h1>
      <p className="relative mt-8 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
        I fine-tuned an open-weight model on thousands of my own texts so my sense of humour would outlive me.
        These are transcripts from the other side.
      </p>

      <div className="relative mt-14 w-full max-w-md text-left">
        <Conversation lines={FEATURED} start={start} size="lg" />
      </div>

      <a
        href="#transcripts"
        className="press absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[0.65rem] uppercase tracking-[0.35em] text-white/35 [@media(hover:hover)]:hover:text-white/70"
      >
        Descend ↓
      </a>
    </header>
  )
}

function Terminal() {
  const [ref, inView] = useInViewOnce<HTMLDivElement>(0.4)
  return (
    <div ref={ref} data-shown={inView} className="reveal mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#03040b] shadow-[0_30px_80px_rgb(0_0_0/0.6)]">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--blood)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-3 font-mono text-xs text-white/35">finetune — zsh</span>
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-[0.8rem] leading-7 text-white/80 sm:text-sm">
          <span className="text-white/40">(venv) aryan@finetune ⇝ </span>
          <span className="text-[var(--ecto)]">grep</span> -rin <span className="text-[var(--candle)]">&quot;celebrity crush&quot;</span> ./data/
          {"\n"}
          <span className="text-white/40">(venv) aryan@finetune ⇝ </span>
          <span className="text-[var(--ecto)]">grep</span> -rin <span className="text-[var(--candle)]">&quot;Karan Johar&quot;</span> ./data/
          {"\n"}
          <span className="text-white/40">(venv) aryan@finetune ⇝ </span>
          <span className="terminal-caret" />
        </pre>
      </div>
      <p className="mx-auto mt-8 max-w-xl text-center leading-relaxed text-white/55">
        Zero results. I have never once mentioned Karan Johar, and I have never been asked about a celebrity crush.
        The ghost has developed opinions of its own.
      </p>
    </div>
  )
}

function Ritual() {
  return (
    <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1.2fr_1fr] md:gap-16">
      <ol className="space-y-8">
        {RITUAL.map((r, i) => (
          <RitualStep key={r.step} index={i} {...r} />
        ))}
      </ol>
      <aside className="h-fit rounded-2xl border border-[rgb(155_28_28/0.4)] bg-[rgb(155_28_28/0.06)] p-6 md:sticky md:top-24">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[#e07a7a]">Autopsy note</p>
        <p className="font-fell mt-3 text-5xl text-[var(--bone)]">1.5%</p>
        <p className="mt-1 text-sm text-white/50">of my messages were funny, according to the data.</p>
        <p className="mt-5 text-sm leading-relaxed text-white/60">
          In WWII the Allies armoured the bullet holes on planes that came back, until someone pointed out the planes that
          never returned. The data only counts jokes that someone laughed at. The real number is far higher. I&apos;d like
          to believe.
        </p>
        <p className="mt-5 border-t border-white/10 pt-4 text-sm text-white/45">
          If you can't tell I'm really proud of this joke        </p>
      </aside>
    </div>
  )
}

function RitualStep({ index, step, detail }: { index: number; step: string; detail: string }) {
  const [ref, inView] = useInViewOnce<HTMLLIElement>(0.5)
  return (
    <li ref={ref} data-shown={inView} className="reveal flex gap-5">
      <span className="font-fell w-10 shrink-0 text-4xl italic text-[var(--candle)]/70">{["I", "II", "III", "IV", "V"][index]}</span>
      <div>
        <h3 className="font-fell text-2xl text-[var(--bone)]">{step}</h3>
        <p className="mt-1 leading-relaxed text-white/55">{detail}</p>
      </div>
    </li>
  )
}

export default function HauntedLanding() {
  useHauntedTab()
  useSecretWord("seance", "/seance/")

  return (
    <main className="haunted relative min-h-screen">
      <CandleGlow />
      <div className="haunted-vignette" aria-hidden />
      <div className="haunted-grain" aria-hidden />

      <Hero />

      <Section id="transcripts" eyebrow="Recovered transcripts" title="Messages from the other side">
        <CandleReader />
      </Section>

      <Section eyebrow="Hallucinations" title="The Karan Johar incident">
        <Terminal />
      </Section>

      <Section eyebrow="Ask the board" title="It only knows what it said">
        <OuijaBoard />
        <p className="mt-6 text-center text-xs text-white/35">Every answer is a real reply from the transcripts above.</p>
      </Section>

      <Section eyebrow="How the ghost was made" title="The ritual">
        <Ritual />
      </Section>

      <footer className="relative z-10 border-t border-white/[0.06] px-4 py-16 text-center">
        <p className="font-fell text-2xl italic text-[var(--bone)]">The séance is closed to the living.</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/45">
          The ghost was trained on real, private conversations, so the circle is invite-only. The source code however is open to all. Highly recommend training your own!
        </p>
        <p className="mt-10 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-white/25">
          An AI simulation, not a real spirit · Hacktoberfest 2026 · Ghost in the Machine
        </p>
      </footer>
    </main>
  )
}
