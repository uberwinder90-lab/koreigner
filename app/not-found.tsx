import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-6"
          style={{ background: 'var(--primary)' }}
        >
          K
        </div>
        <h1 className="text-5xl font-extrabold mb-3" style={{ color: 'var(--text-1)' }}>404</h1>
        <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-2)' }}>Page not found</p>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-4)' }}>
          The page you are looking for does not exist or has been moved.
          <br />
          찾으시는 페이지가 없거나 이동되었습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary px-6 py-3">
            Go to Home
          </Link>
          <Link href="/submit" className="btn-secondary px-6 py-3">
            Write a Post
          </Link>
        </div>
      </div>
    </div>
  )
}
