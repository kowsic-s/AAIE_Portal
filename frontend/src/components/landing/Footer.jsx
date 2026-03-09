export default function Footer() {
  return (
    <footer className="border-t border-[var(--lp-border)] py-10"
      style={{ background: 'var(--lp-bg-2)' }}>
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 flex items-center justify-between flex-wrap gap-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-[8px] flex items-center justify-center bg-gradient-to-br from-[#4f8ef7] to-[#7c6af7]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <span className="font-display text-[0.875rem] font-bold text-[var(--lp-text-2)]">
            AAIE — Academic AI Intervention Engine
          </span>
        </div>
        <span className="text-[0.8rem] text-[var(--lp-text-3)]">v1.0 — 2025</span>
        <div className="flex gap-5">
          {['Documentation', 'Privacy', 'Support'].map((t) => (
            <a
              key={t}
              href="#"
              className="text-[0.8rem] text-[var(--lp-text-3)] no-underline hover:text-[var(--lp-text-1)] transition-colors duration-200"
            >
              {t}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
