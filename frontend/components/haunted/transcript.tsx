"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Line } from "@/lib/transcripts"

type Bubble = { from: Line["from"]; text: string; continues: boolean }

export function useReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduce(mq.matches)
    const onChange = () => setReduce(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return reduce
}

export function useInViewOnce<T extends Element>(threshold = 0.35) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, inView] as const
}

function toBubbles(lines: Line[]): Bubble[] {
  return lines.flatMap((line) =>
    line.text.split("\n").map((text, i) => ({ from: line.from, text, continues: i > 0 })),
  )
}

// Plays a conversation back like it is arriving live: your lines land quickly,
// the ghost "types" before each reply. Bubbles stay mounted so cards never reflow.
function usePlayback(bubbles: Bubble[], start: boolean, reduce: boolean) {
  const [shown, setShown] = useState(0)
  const [typingAt, setTypingAt] = useState<number | null>(null)

  useEffect(() => {
    if (!start) return
    if (reduce) {
      setShown(bubbles.length)
      return
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    let t = 150
    bubbles.forEach((b, i) => {
      if (b.from === "you") {
        t += i === 0 ? 0 : 380
        timers.push(setTimeout(() => setShown(i + 1), t))
      } else {
        const typing = b.continues ? 650 : 1000
        timers.push(setTimeout(() => setTypingAt(i), t + 120))
        t += 120 + typing
        timers.push(
          setTimeout(() => {
            setTypingAt(null)
            setShown(i + 1)
          }, t),
        )
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [bubbles, start, reduce])

  return { shown, typingAt }
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 px-1" aria-hidden>
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </span>
  )
}

export function Conversation({ lines, start, size = "md" }: { lines: Line[]; start: boolean; size?: "md" | "lg" }) {
  const reduce = useReducedMotion()
  const bubbles = useMemo(() => toBubbles(lines), [lines])
  const { shown, typingAt } = usePlayback(bubbles, start, reduce)

  return (
    <div className={size === "lg" ? "flex flex-col gap-2 text-lg sm:text-xl" : "flex flex-col gap-1.5"}>
      {bubbles.map((b, i) => {
        const gapAbove = i > 0 && bubbles[i - 1].from !== b.from
        return (
          <div key={i} className={`relative ${gapAbove ? "mt-2" : ""}`}>
            <p
              data-shown={i < shown}
              className={`bubble ${b.from === "you" ? "bubble-you" : "bubble-ghost"} ${size === "lg" ? "!text-[1.05em] !px-5 !py-3" : ""}`}
            >
              {b.text}
            </p>
            {typingAt === i && (
              <span className="bubble-ghost absolute left-0 top-1/2 -translate-y-1/2 rounded-full px-3 py-2.5">
                <TypingDots />
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
