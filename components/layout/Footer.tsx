export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', marginTop: '4rem' }}>
      <div className="page-container py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}
            >
              K
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Koreigner</span>
            <span className="text-xs" style={{ color: 'var(--text-4)' }}>
              Community for foreigners in Korea
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-4)' }}>
            <a href="#" className="hover:text-[var(--text-2)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--text-2)] transition-colors">Terms</a>
            <a href="#" className="hover:text-[var(--text-2)] transition-colors">Contact</a>
            <span>© {new Date().getFullYear()}</span>
          </nav>
        </div>
      </div>
    </footer>
  )
}
