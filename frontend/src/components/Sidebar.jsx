import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { logoutApi } from '../api/auth'

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d={d} />
  </svg>
)

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <GridIcon />, section: 'Overview' },
  { to: '/admin/users', label: 'Users', icon: <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />, section: 'Management' },
  { to: '/admin/departments', label: 'Departments', icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />, section: 'Management' },
  { to: '/admin/bulk-upload', label: 'Bulk Upload', icon: <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />, section: 'Management' },
  { to: '/admin/settings', label: 'Settings', icon: <Icon d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />, section: 'Management' },
  { to: '/admin/model', label: 'Model Governance', icon: <Icon d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />, section: 'Intelligence' },
]

const staffLinks = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: <GridIcon />, section: 'Overview' },
  { to: '/staff/students', label: 'Students', icon: <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />, section: 'Management' },
  { to: '/staff/interventions', label: 'Interventions', icon: <Icon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />, section: 'Management' },
  { to: '/staff/upload', label: 'Upload Data', icon: <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />, section: 'Management' },
]

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', icon: <GridIcon />, section: 'Overview' },
  { to: '/student/performance', label: 'Performance', icon: <Icon d="M22 12h-4l-3 9L9 3l-3 9H2" />, section: 'Academics' },
  { to: '/student/what-if', label: 'What-If Analysis', icon: <Icon d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />, section: 'Academics' },
  { to: '/student/recommendations', label: 'AI Recommendations', icon: <Icon d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />, section: 'Academics' },
]

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const links = {
    admin: adminLinks,
    staff: staffLinks,
    student: studentLinks,
  }[user?.role] || []

  const roleLabels = { admin: 'Administrator', staff: 'Teaching Staff', student: 'Student' }

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken
    try { if (refreshToken) await logoutApi(refreshToken) } catch {}
    logout()
    navigate('/login')
  }

  const handleNavClick = () => onMobileClose?.()

  // Group links by section
  const sections = []
  let currentSection = null
  links.forEach((link) => {
    if (link.section !== currentSection) {
      currentSection = link.section
      sections.push({ label: currentSection, items: [] })
    }
    sections[sections.length - 1].items.push(link)
  })

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={`flex flex-col transition-all duration-300 border-r border-white/[0.08]
          ${collapsed ? 'lg:w-[68px]' : 'lg:w-[260px]'} w-[260px]
          fixed lg:static inset-y-0 left-0 z-50
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          min-h-screen`}
        style={{ background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.08] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="white" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {!collapsed && <span className="font-bold text-[#f0f4ff] text-sm tracking-tight">AAIE</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-5 pt-4 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[#475569]">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5 px-2">
                {section.items.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-[0.85rem] font-medium ${
                        isActive
                          ? 'bg-[rgba(59,130,246,0.15)] text-[#3b82f6] border-l-[3px] border-l-[#3b82f6] ml-0'
                          : 'text-[#94a3b8] hover:bg-white/[0.06] hover:text-[#f0f4ff]'
                      }`
                    }
                  >
                    <span className="flex-shrink-0">{link.icon}</span>
                    {!collapsed && <span className="truncate">{link.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom user */}
        <div className="border-t border-white/[0.08] p-3 flex-shrink-0">
          <div className={`flex items-center gap-3 p-2.5 rounded-xl ${collapsed ? 'justify-center' : ''}`}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[0.8rem] font-semibold text-[#f0f4ff] truncate">{user?.name}</p>
                <p className="text-[0.65rem] text-[#475569] truncate">{roleLabels[user?.role]}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={handleLogout} className="text-[#475569] hover:text-[#ef4444] transition-colors flex-shrink-0" title="Logout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onToggle}
              className="w-full mt-2 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[#475569] hover:text-[#94a3b8] hover:bg-white/[0.04] transition-all text-xs hidden lg:flex"
            >
              {collapsed ? '→' : '← Collapse'}
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar
