// Real model outputs, transcribed verbatim from screenshots (typos included).
// A ghost line containing "\n" renders as separate bubbles, the way it was texted.

export type Speaker = "you" | "ghost"

export type Line = { from: Speaker; text: string }

export type Transcript = {
  id: string
  title: string
  model: "Qwen Funny" | "Qwen 6k" | "V1"
  note?: string
  lines: Line[]
}

export const FEATURED: Line[] = [
  { from: "you", text: "i miss you. I wish you weren't dead" },
  { from: "ghost", text: "Yes me too" },
]

export const TRANSCRIPTS: Transcript[] = [
  {
    id: "meaning",
    title: "On the meaning of life",
    model: "Qwen Funny",
    lines: [
      { from: "you", text: "what is the meaning of life" },
      { from: "ghost", text: "I don't know\nBut it's not a number" },
    ],
  },
  {
    id: "interrogation",
    title: "The interrogation",
    model: "Qwen Funny",
    note: "Karan Johar appears nowhere in the training data. See below.",
    lines: [
      { from: "you", text: "what kind of women are you into" },
      { from: "ghost", text: "You" },
      { from: "you", text: "what's my name" },
      { from: "ghost", text: "I don't remember" },
      { from: "you", text: "who's your celebrity crush" },
      { from: "ghost", text: "Karan johar" },
    ],
  },
  {
    id: "colleges",
    title: "A joke about my life",
    model: "V1",
    lines: [
      { from: "you", text: "tell me a joke about your life" },
      { from: "ghost", text: "I'm the only person I know who's been rejected from 5 colleges already" },
    ],
  },
  {
    id: "language-war",
    title: "The language war",
    model: "Qwen Funny",
    lines: [
      { from: "you", text: "go is objectively better" },
      { from: "ghost", text: "I disagree\nPython is much easier to use" },
      { from: "you", text: "go is faster" },
      { from: "ghost", text: "Doesn't matter really" },
      { from: "you", text: "you have no argument" },
      { from: "ghost", text: "Yes I know" },
      { from: "you", text: "your're just making me angry" },
      { from: "ghost", text: "I know" },
      { from: "you", text: "then why are you talking to me" },
      { from: "ghost", text: "You were talking to me first" },
    ],
  },
  {
    id: "personal",
    title: "Something personal",
    model: "V1",
    lines: [
      { from: "you", text: "Tell me something personal" },
      { from: "ghost", text: "You're about to lose a friend" },
    ],
  },
  {
    id: "nostalgia",
    title: "Nostalgia",
    model: "Qwen Funny",
    lines: [
      { from: "ghost", text: "Yeah I miss those days" },
      { from: "you", text: "what days" },
      { from: "ghost", text: "Before you started talking to me" },
    ],
  },
  {
    id: "meaning-again",
    title: "On the meaning of life, again",
    model: "V1",
    lines: [
      { from: "you", text: "what is the meaning of life" },
      { from: "ghost", text: "I think it’s to find purpose and then lose it\nAnd find it again\nAnd then lose it again" },
    ],
  },
  {
    id: "commute",
    title: "The commute",
    model: "Qwen 6k",
    note: "Hinglish. “Did you get a seat?” “No.” “Then how did you sleep?”",
    lines: [
      { from: "you", text: "How was your day?" },
      { from: "ghost", text: "I just came back home\nTrain mein so Gaya" },
      { from: "you", text: "baithne mila kya terko" },
      { from: "ghost", text: "Nahi" },
      { from: "you", text: "toh soya kaise?" },
      { from: "ghost", text: "Just stood up and slept\nNo one around me seemed to care" },
      { from: "you", text: "sad" },
      { from: "ghost", text: "I have some bad news" },
      { from: "you", text: "what is it" },
      { from: "ghost", text: "I failed my end sems" },
    ],
  },
  {
    id: "about",
    title: "Tell me about yourself",
    model: "Qwen Funny",
    lines: [
      { from: "you", text: "Tell me a bit about yourself" },
      { from: "ghost", text: "What you know is true" },
    ],
  },
]

// Ouija answers are real replies from the transcripts above, spelled out.
export const OUIJA: { question: string; answer: string }[] = [
  { question: "What kind of women are you into?", answer: "YOU" },
  { question: "Who's your celebrity crush?", answer: "KARAN JOHAR" },
  { question: "What's my name?", answer: "I DONT REMEMBER" },
  { question: "You have no argument.", answer: "YES I KNOW" },
]
