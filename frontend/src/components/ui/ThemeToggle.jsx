import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <motion.button
      onClick={toggle}
      whileHover={{ rotate: 20 }}
      className="w-10 h-10 rounded-[10px] flex items-center justify-center
                 bg-[var(--lp-surface-2)] border border-[var(--lp-border)]
                 text-[var(--lp-text-2)] hover:bg-[var(--lp-surface-3)]
                 hover:text-[var(--lp-text-1)] transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
    </motion.button>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
    </svg>
  )
}
