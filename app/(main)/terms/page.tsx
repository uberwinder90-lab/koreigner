import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Koreigner Terms of Service — rules and guidelines for using our community.',
}

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or using the Koreigner platform, you agree to these Terms of Service. If you do not agree, please do not use the service.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be at least 13 years of age to use Koreigner. By using our service, you confirm that you meet this age requirement.',
  },
  {
    title: '3. Community Guidelines',
    body: 'Users must be respectful and constructive. Prohibited content includes: hate speech, harassment, spam, illegal content, misinformation intended to harm others, and content that violates Korean law. Violations may result in content removal or account suspension.',
  },
  {
    title: '4. User Content',
    body: 'You retain ownership of content you post. By posting on Koreigner, you grant us a non-exclusive, royalty-free license to display and distribute that content on our platform. You are responsible for ensuring your content does not infringe third-party rights.',
  },
  {
    title: '5. Account Responsibility',
    body: 'You are responsible for maintaining the security of your account credentials. Notify us immediately if you suspect unauthorized access. We are not liable for losses arising from unauthorized account use.',
  },
  {
    title: '6. Service Availability',
    body: 'We strive for high availability but do not guarantee uninterrupted service. We may modify, suspend, or discontinue features at any time with reasonable notice where possible.',
  },
  {
    title: '7. Disclaimer of Warranties',
    body: 'The platform is provided "as is" without warranties of any kind. We do not warrant the accuracy or reliability of any user-generated content. Information on Koreigner (including visa, legal, or financial information) is provided by community members and should be verified with official sources.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'To the maximum extent permitted by law, Koreigner shall not be liable for indirect, incidental, special, or consequential damages arising from use of the platform.',
  },
  {
    title: '9. Changes to Terms',
    body: 'We may update these terms periodically. Continued use of the platform after changes constitutes acceptance of the new terms. Major changes will be announced within the platform.',
  },
  {
    title: '10. Contact',
    body: 'For terms-related inquiries: legal@koreigner.com',
  },
]

export default function TermsPage() {
  return (
    <div className="page-container py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-6 hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--text-4)' }}>
          ← Back to Home
        </Link>

        <div className="card p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--text-1)' }}>Terms of Service</h1>
            <p className="text-sm" style={{ color: 'var(--text-4)' }}>Last updated: March 2026</p>
          </div>

          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-3)' }}>
            Welcome to Koreigner. Please read these Terms of Service carefully before using our platform. These terms govern your use of the Koreigner community website.
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
