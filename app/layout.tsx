import type { Metadata, Viewport } from 'next'
import { Pixelify_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const pixelifySans = Pixelify_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Minecraft Crafting Tracker',
  description: 'Track your Minecraft crafting projects and dependencies',
}

export const viewport: Viewport = {
  themeColor: '#1a1a1e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${pixelifySans.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
