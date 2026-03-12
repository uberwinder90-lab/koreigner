import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Koreigner Privacy Policy — how we collect, use, and protect your data.',
}

const sections = [
  {
    title: '1. Information We Collect',
    body: 'We collect information you provide directly, such as your email address, username, display name, and profile picture when you register. We also collect content you post, comments you write, and files you upload. Usage data such as page views and interactions may be collected automatically.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use your information to operate and improve the Koreigner platform, send account-related emails (e.g., email verification), personalize your experience, and ensure the safety of our community.',
  },
  {
    title: '3. Data Sharing',
    body: 'We do not sell your personal information to third parties. Your profile information (username, display name, profile picture) is publicly visible to other users. We may share data with service providers (Supabase, Vercel, Resend) solely to operate our platform.',
  },
  {
    title: '4. Data Storage & Security',
    body: 'Your data is stored on Supabase infrastructure with row-level security policies. We use industry-standard security practices. However, no method of transmission over the internet is 100% secure.',
  },
  {
    title: '5. Your Rights',
    body: 'You may update your profile at any time from your account settings. You may delete your account, which will remove your personal data from our systems. To request data export or deletion, contact us at the email below.',
  },
  {
    title: '6. Cookies',
    body: 'We use essential cookies for authentication session management and a "lang" cookie to remember your language preference. We do not use tracking or advertising cookies.',
  },
  {
    title: '7. Contact',
    body: 'For privacy-related inquiries, please contact: privacy@koreigner.com',
  },
]

export default function PrivacyPage() {
  return (
    <div className="page-container py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-6 hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--text-4)' }}>
          ← Back to Home
        </Link>

        <div className="card p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--text-1)' }}>Privacy Policy</h1>
            <p className="text-sm" style={{ color: 'var(--text-4)' }}>Last updated: March 2026</p>
          </div>

          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-3)' }}>
            Koreigner ("we", "our", "us") is committed to protecting the privacy of foreigners living in Korea who use our community platform. This Privacy Policy explains how we handle your personal information.
          </p>

          <div className="space-y-6">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text-1)' }}>{s.title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
