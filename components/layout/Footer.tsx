export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-12">
      <div className="page-container py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-tertiary">
        <p>© {new Date().getFullYear()} Koreigner — Community for foreigners in Korea</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-text-secondary transition-colors">Privacy</a>
          <a href="#" className="hover:text-text-secondary transition-colors">Terms</a>
          <a href="#" className="hover:text-text-secondary transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  )
}
