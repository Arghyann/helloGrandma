import type { Metadata } from 'next'
import { Caveat, Geist, Geist_Mono, IM_Fell_English, Special_Elite } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const fell = IM_Fell_English({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-fell" });
const typewriter = Special_Elite({ subsets: ["latin"], weight: "400", variable: "--font-type" });
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: 'Talk to the Dead | Ghost of Aryan',
  description: 'A séance with a ghost fine-tuned on texts from its creator, powered by open-weight models. An AI simulation, not a real spirit.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icons8-favicon-doodle-16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/icons8-favicon-doodle-96.png',
        sizes: '96x96',
        type: 'image/png',
      },
    ],
    apple: '/icons8-favicon-doodle-96.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${fell.variable} ${typewriter.variable} ${hand.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
