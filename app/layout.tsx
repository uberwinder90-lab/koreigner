import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Koreigner — Community for Foreigners in Korea',
    template: '%s | Koreigner',
  },
  description: 'A community platform for foreigners living in Korea. Share experiences, ask questions, and connect with others.',
  keywords: ['Korea', 'expat', 'foreigner', 'community', 'Seoul'],
  openGraph: {
    title: 'Koreigner',
    description: 'Community for foreigners living in Korea',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="min-h-[calc(100vh-56px-80px)]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
