import useAuthStore from '../store/authStore'

const Navbar = ({ title, onMenuToggle }) => {
  const { user } = useAuthStore()

  return (
    <header
      className="px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10 border-b border-white/[0.06]"
      style={{ background: 'rgba(10,15,30,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="text-[#94a3b8] hover:text-[#f0f4ff] lg:hidden p-1 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-[#f0f4ff]">{title || 'AAIE'}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-[#f0f4ff]">{user?.name}</p>
          <p className="text-xs text-[#475569] capitalize">{user?.role}</p>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}

export default Navbar
