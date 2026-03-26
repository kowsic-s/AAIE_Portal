import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore.js'
import { logoutApi } from '../api/auth.js'

const I = ({ children }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">{children}</svg>
)

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', section: 'Overview', icon: <I><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></I> },
  { to: '/admin/users', label: 'Users', section: 'Management', icon: <I><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></I> },
  { to: '/admin/departments', label: 'Departments', section: 'Management', icon: <I><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></I> },
  { to: '/admin/bulk-upload', label: 'Bulk Upload', section: 'Management', icon: <I><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></I> },
  { to: '/admin/settings', label: 'Settings', section: 'Management', icon: <I><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></I> },
  { to: '/admin/model', label: 'Model Governance', section: 'Intelligence', icon: <I><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></I> },
]

const staffLinks = [
  { to: '/staff/dashboard', label: 'Dashboard', section: 'Overview', icon: <I><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></I> },
  { to: '/staff/students', label: 'Students', section: 'Management', icon: <I><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></I> },
  { to: '/staff/interventions', label: 'Interventions', section: 'Management', icon: <I><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></I> },
  { to: '/staff/upload', label: 'Upload Data', section: 'Management', icon: <I><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></I> },
]

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', section: 'Overview', icon: <I><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></I> },
  { to: '/student/performance', label: 'Performance', section: 'Academics', icon: <I><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></I> },
  { to: '/student/interventions', label: 'Interventions', section: 'Academics', icon: <I><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></I> },
  { to: '/student/what-if', label: 'What-If Analysis', section: 'Academics', icon: <I><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></I> },
  { to: '/student/recommendations', label: 'AI Recommendations', section: 'Academics', icon: <I><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></I> },
]

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const links = { admin: adminLinks, staff: staffLinks, student: studentLinks }[user?.role] || []
  const roleLabels = { admin: 'Administrator', staff: 'Teaching Staff', student: 'Student' }

  const handleLogout = async () => {
    const rt = useAuthStore.getState().refreshToken
    try { if (rt) await logoutApi(rt) } catch {}
    logout()
    navigate('/login')
  }

  // Group links by section
  const sections = []
  let cur = null
  links.forEach((l) => {
    if (l.section !== cur) { cur = l.section; sections.push({ label: cur, items: [] }) }
    sections[sections.length - 1].items.push(l)
  })

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={`flex flex-col w-[252px] fixed inset-y-0 left-0 z-50 transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ background: 'var(--sidebar-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 4px 12px var(--glow-a)' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 6v8l7 4 7-4V6L10 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="10" cy="10" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="font-display text-base font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>AAIE</span>
          {user?.role === 'staff' && (
            <span className="ml-auto text-[0.6rem] font-display font-bold uppercase tracking-[0.08em] px-2 py-[3px] rounded-full"
              style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.2)', color: 'var(--accent)' }}>
              Staff
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-5 pt-3 pb-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-3)' }}>
                {section.label}
              </p>
              <div className="px-2 space-y-[1px]">
                {section.items.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => onMobileClose?.()}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-4 py-[9px] mx-0 rounded-[10px] text-[0.875rem] font-medium transition-all duration-200 no-underline ${
                        isActive
                          ? 'border-l-2 ml-[6px]'
                          : ''
                      }`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? { background: 'rgba(79,142,247,0.12)', color: 'var(--accent)', borderLeftColor: 'var(--accent)' }
                        : { color: 'var(--text-2)' }
                    }
                  >
                    <span className="flex-shrink-0">{link.icon}</span>
                    <span className="truncate">{link.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom user pill */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 text-white text-xs font-display font-bold"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.8rem] font-semibold truncate" style={{ color: 'var(--text-1)' }}>{user?.name}</p>
              <p className="text-[0.68rem] truncate" style={{ color: 'var(--text-3)' }}>{roleLabels[user?.role]}</p>
            </div>
            <button onClick={handleLogout} className="p-1 rounded-md transition-colors flex-shrink-0" style={{ color: 'var(--text-3)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--risk-high)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}
              title="Logout"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
