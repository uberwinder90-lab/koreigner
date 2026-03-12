import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', marginTop: '4rem' }}>
      <div className="page-container py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs"
              style={{ background: 'var(--primary)' }}
            >
              K
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Koreigner</span>
            <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-4)' }}>
              Community for foreigners in Korea
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-xs" style={{ color: 'var(--text-4)' }}>
            <Link href="/privacy" className="hover:text-[var(--text-2)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text-2)] transition-colors">Terms</Link>
            <a href="mailto:hello@koreigner.com" className="hover:text-[var(--text-2)] transition-colors">Contact</a>
            <span>© {new Date().getFullYear()} Koreigner</span>
          </nav>
        </div>
      </div>
    </footer>
  )
}
