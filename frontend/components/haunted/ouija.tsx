"use client"

import { useEffect, useRef, useState } from "react"
import { OUIJA } from "@/lib/transcripts"
import { useReducedMotion } from "./transcript"

type Glyph = { key: string; label: string; x: number; y: number; rot: number; size: "sm" | "md" | "lg" }

// Board layout in fractions of the board's width/height, so the planchette can
// target any glyph at any board size.
const GLYPHS: Glyph[] = (() => {
  const out: Glyph[] = []
  const arc = (letters: string, x0: number, x1: number, y: number, lift: number) =>
    letters.split("").forEach((ch, i, all) => {
      const t = i / (all.length - 1)
      out.push({
        key: ch,
        label: ch,
        x: x0 + (x1 - x0) * t,
        y: y - lift * Math.sin(Math.PI * t),
        rot: (t - 0.5) * 34,
        size: "md",
      })
    })
  arc("ABCDEFGHIJKLM", 0.08, 0.92, 0.42, 0.14)
  arc("NOPQRSTUVWXYZ", 0.12, 0.88, 0.63, 0.12)
  "1234567890".split("").forEach((n, i) => out.push({ key: n, label: n, x: 0.24 + i * 0.058, y: 0.79, rot: 0, size: "sm" }))
  out.push({ key: "YES", label: "Yes", x: 0.14, y: 0.12, rot: 0, size: "lg" })
  out.push({ key: "NO", label: "No", x: 0.86, y: 0.12, rot: 0, size: "lg" })
  out.push({ key: "GOODBYE", label: "Goodbye", x: 0.5, y: 0.92, rot: 0, size: "lg" })
  return out
})()

const REST = { x: 0.5, y: 0.2 }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function Planchette() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="pl-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3e6c8" />
          <stop offset="1" stopColor="#bfa77a" />
        </linearGradient>
      </defs>
      <path
        d="M50 4 C70 4 94 30 94 56 C94 80 76 96 50 96 C24 96 6 80 6 56 C6 30 30 4 50 4 Z"
        fill="url(#pl-wood)"
        fillOpacity="0.92"
        stroke="#5b4426"
        strokeWidth="2"
        fillRule="evenodd"
      />
      <circle cx="50" cy="50" r="17" fill="#000" fillOpacity="0.35" stroke="#5b4426" strokeWidth="3" />
      <circle cx="50" cy="50" r="15" fill="rgb(244 163 64 / 0.12)" />
    </svg>
  )
}

export function OuijaBoard() {
  const boardRef = useRef<HTMLDivElement>(null)
  const planchetteRef = useRef<HTMLDivElement>(null)
  const runId = useRef(0)
  const [lit, setLit] = useState<string | null>(null)
  const [spelled, setSpelled] = useState("")
  const [active, setActive] = useState<number | null>(null)
  const reduce = useReducedMotion()

  const moveTo = (fx: number, fy: number) => {
    const board = boardRef.current
    const pl = planchetteRef.current
    if (!board || !pl) return
    const size = pl.offsetWidth
    pl.style.transform = `translate3d(${fx * board.clientWidth - size / 2}px, ${fy * board.clientHeight - size / 2}px, 0)`
  }

  useEffect(() => {
    moveTo(REST.x, REST.y)
    const onResize = () => moveTo(REST.x, REST.y)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const ask = async (index: number) => {
    const id = ++runId.current
    const alive = () => runId.current === id
    const { answer } = OUIJA[index]
    setActive(index)
    setSpelled("")
    setLit(null)

    if (reduce) {
      setSpelled(answer)
      return
    }

    await sleep(300)
    for (const ch of answer) {
      if (!alive()) return
      if (ch === " ") {
        setSpelled((s) => s + " ")
        await sleep(320)
        continue
      }
      const glyph = GLYPHS.find((g) => g.key === ch)
      if (!glyph) continue
      setLit(null)
      moveTo(glyph.x, glyph.y + 0.02)
      await sleep(660)
      if (!alive()) return
      setLit(ch)
      setSpelled((s) => s + ch)
      await sleep(380)
    }
    if (!alive()) return
    setLit(null)
    moveTo(REST.x, REST.y)
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        ref={boardRef}
        className="ouija-board font-fell relative aspect-[3/2] w-full select-none overflow-hidden rounded-[2rem] sm:rounded-[3rem]"
        aria-hidden
      >
        <div className="pointer-events-none absolute inset-3 rounded-[1.6rem] border border-[rgb(244_163_64/0.25)] sm:inset-5 sm:rounded-[2.5rem]" />
        <span className="absolute left-1/2 top-[11%] -translate-x-1/2 text-[2.2vw] tracking-[0.4em] text-white/30 sm:text-sm">
          ☾ ✶ ☽
        </span>
        {GLYPHS.map((g) => (
          <span
            key={g.key}
            data-lit={lit === g.key}
            className={`ouija-glyph ${g.size === "lg" ? "text-[4vw] italic sm:text-3xl" : g.size === "sm" ? "text-[2.6vw] sm:text-lg" : "text-[4.4vw] sm:text-[2rem]"}`}
            style={{ left: `${g.x * 100}%`, top: `${g.y * 100}%`, ["--rot" as string]: `${g.rot}deg` }}
          >
            {g.label}
          </span>
        ))}
        <div ref={planchetteRef} className="planchette [--pl:52px] sm:[--pl:84px]">
          <Planchette />
        </div>
      </div>

      <p className="font-fell mt-6 min-h-[2.5rem] text-center text-2xl tracking-[0.3em] text-[var(--candle)] sm:text-3xl" aria-live="polite">
        {spelled}
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {OUIJA.map((q, i) => (
          <button
            key={q.question}
            onClick={() => ask(i)}
            className={`press rounded-full border px-4 py-2 text-sm ${
              active === i
                ? "border-[var(--candle)] bg-[rgb(244_163_64/0.12)] text-[var(--bone)]"
                : "border-white/15 text-white/60 [@media(hover:hover)]:hover:border-white/35 [@media(hover:hover)]:hover:text-white"
            }`}
          >
            {q.question}
          </button>
        ))}
      </div>
    </div>
  )
}
