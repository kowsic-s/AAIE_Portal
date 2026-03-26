import useAuthStore from '../store/authStore'
import { useTheme } from '../context/ThemeContext'
import { useLocation, useNavigate } from 'react-router-dom'

const Navbar = ({ title, subtitle, onMenuToggle }) => {
  const { user } = useAuthStore()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const showStaffQuickAction = user?.role === 'staff' && !location.pathname.startsWith('/staff/students/')

  return (
    <header
      className="h-16 flex items-center px-4 sm:px-8 gap-5 sticky top-0 z-10"
      style={{ background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1 transition-colors"
        style={{ color: 'var(--text-2)' }}
        aria-label="Toggle sidebar"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div>
        <div className="font-display text-[1.1rem] font-bold" style={{ color: 'var(--text-1)' }}>{title || 'Dashboard'}</div>
        {subtitle && <div className="text-[0.8rem] mt-[1px]" style={{ color: 'var(--text-3)' }}>{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2.5 ml-auto">
        {showStaffQuickAction && (
          <button className="btn-primary" onClick={() => navigate('/staff/interventions')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Intervention
          </button>
        )}
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center transition-all"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
          )}
        </button>
        {/* Notification bell */}
        <div
          className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center relative"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <div className="absolute top-2 right-2 w-[7px] h-[7px] rounded-full" style={{ background: 'var(--risk-high)', border: '2px solid var(--bg-2)' }} />
        </div>
      </div>
    </header>
  )
}

export default Navbar
