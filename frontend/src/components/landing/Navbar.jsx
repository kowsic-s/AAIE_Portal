import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ThemeToggle from '../ui/ThemeToggle.jsx'

export default function LandingNavbar() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { href: '#how', label: 'How it Works' },
    { href: '#features', label: 'Features' },
    { href: '#portals', label: 'Portals' },
    { href: '#ml', label: 'ML Engine' },
  ]

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-[100] h-[68px] flex items-center transition-all duration-300
        ${scrolled
          ? 'bg-[rgba(7,12,24,0.80)] backdrop-blur-[24px] border-b border-[var(--lp-border)]'
          : 'bg-transparent'
        }`}
    >
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 flex items-center justify-between w-full">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 no-underline">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-[#4f8ef7] to-[#7c6af7] shadow-glow-blue flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <span className="font-display text-[1.1rem] font-bold text-[var(--lp-text-1)]">AAIE</span>
        </a>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[var(--lp-text-2)] font-medium px-3.5 py-1.5 rounded-lg
                         hover:bg-[var(--lp-surface-2)] hover:text-[var(--lp-text-1)]
                         transition-all duration-200 no-underline"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 font-body font-semibold text-sm
                       rounded-xl px-4 py-2.5 transition-all duration-200 cursor-pointer
                       bg-gradient-to-br from-[#4f8ef7] to-[#7c6af7] text-white
                       shadow-[0_6px_24px_rgba(79,142,247,0.25)]
                       hover:shadow-[0_10px_32px_rgba(79,142,247,0.35)]
                       border border-[rgba(79,142,247,0.4)]"
          >
            Access Portal
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="5 12 19 12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  )
}
