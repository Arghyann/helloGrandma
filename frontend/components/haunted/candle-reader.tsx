"use client"

import { KeyboardEvent, useRef, useState } from "react"
import { TRANSCRIPTS } from "@/lib/transcripts"
import type { Line } from "@/lib/transcripts"
import { useInViewOnce } from "./transcript"

const MODEL_STYLE = {
  "Qwen Funny": "text-[var(--candle)]",
  "Qwen 6k": "text-[var(--ecto)]",
  V1: "text-[var(--bone-dim)]",
} as const

// One transcript is lit at a time; the others wait in the dark as titles.
// A candle beside the stage is the only light source.
export function CandleReader() {
  const [active, setActive] = useState(0)
  const [ref, inView] = useInViewOnce<HTMLDivElement>(0.25)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const t = TRANSCRIPTS[active]

  const onKeyDown = (e: KeyboardEvent) => {
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0
    if (!next) return
    e.preventDefault()
    const i = (active + next + TRANSCRIPTS.length) % TRANSCRIPTS.length
    setActive(i)
    tabRefs.current[i]?.focus()
  }

  return (
    <div ref={ref} data-shown={inView} className="reveal grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-10">
      <div
        role="tablist"
        aria-label="Recovered transcripts"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
      >
        {TRANSCRIPTS.map((tr, i) => (
          <button
            key={tr.id}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            role="tab"
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className="reader-item press flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left"
          >
            <span className="flex w-2.5 justify-center">{i === active ? <span className="flame" aria-hidden /> : <span className="h-1 w-1 rounded-full bg-current opacity-60" aria-hidden />}</span>
            <span className="font-fell whitespace-nowrap text-lg italic lg:whitespace-normal">{tr.title}</span>
          </button>
        ))}
      </div>

      <div className="reader-room">
        <div className="reader-stage">
          <div className="candle-light" aria-hidden />
          <div className="candle-rays" aria-hidden />
          <article key={t.id} role="tabpanel" className="reader-in paper ml-auto w-full max-w-lg">
            <header className="border-b border-[rgb(70_45_20/0.25)] pb-4">
              <p className="font-type text-[0.7rem] uppercase tracking-[0.2em] text-[rgb(60_40_20/0.65)]">
                Séance transcript № {String(active + 1).padStart(2, "0")} · {t.model}
              </p>
              <h3 className="font-fell mt-2 text-3xl italic text-[#2a1a0e]">{t.title}</h3>
            </header>
            <div className="reader-scroll mt-2">
              <PaperLines lines={t.lines} />
              {t.note && <p className="font-fell mt-6 text-sm italic leading-relaxed text-[rgb(60_40_20/0.7)]">{t.note}</p>}
            </div>
          </article>
          <div className="candle-cast" aria-hidden />
        </div>
        <Candle />
      </div>
    </div>
  )
}

// The questions are typed; the ghost's replies come back in handwritten ink.
function PaperLines({ lines }: { lines: Line[] }) {
  return (
    <dl className="space-y-4">
      {lines.map((line, i) =>
        line.from === "you" ? (
          <div key={i} className="flex gap-3">
            <dt className="font-type shrink-0 pt-0.5 text-xs uppercase tracking-widest text-[rgb(60_40_20/0.5)]">You</dt>
            <dd className="font-type text-[0.95rem] leading-relaxed text-[#2b1d12]">{line.text}</dd>
          </div>
        ) : (
          <div key={i} className="flex gap-3">
            <dt className="font-type shrink-0 pt-2 text-xs uppercase tracking-widest text-[rgb(110_30_20/0.6)]">Ghost</dt>
            <dd className="font-hand whitespace-pre-line text-[1.7rem] leading-[1.15] text-[#5e1a12]">{line.text}</dd>
          </div>
        ),
      )}
    </dl>
  )
}

// Your candle GIF, leaning in from below the stage's bottom-left corner, in
// the empty side of the stage, with its flame reaching toward the conversation. The holder is a zero-size point
// at the candle's base, so rotating it pivots the candle where it stands.
function Candle() {
  return (
    <div className="candle-holder" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/candle.gif" alt="" />
    </div>
  )
}
