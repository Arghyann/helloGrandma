import type { Metadata } from "next"
import ChatbotUI from "@/components/chatbot-ui"

// Unlinked from the landing page and kept out of search results. Access is
// still enforced by the API's invite codes; this only keeps the door hidden.
export const metadata: Metadata = {
  title: "The Séance",
  robots: { index: false, follow: false },
}

export default function Seance() {
  return <ChatbotUI />
}
