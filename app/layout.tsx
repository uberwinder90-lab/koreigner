import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { LangProvider } from '@/lib/i18n'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={inter.variable}>
      <body>
        <LangProvider>
          <Header />
          <main className="min-h-[calc(100vh-60px-73px)]">
            {children}
          </main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  )
}
