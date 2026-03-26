import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoggingIn, loginError, isAuthenticated, user } = useAuth()
  const _hasHydrated = useAuthStore((s) => s._hasHydrated)

  if (_hasHydrated && isAuthenticated && user) {
    const roleHome = { admin: '/admin/dashboard', staff: '/staff/dashboard', student: '/student/dashboard' }
    return <Navigate to={roleHome[user.role] || '/login'} replace />
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) return
    login({ email, password })
  }

  const errorMsg = loginError?.response?.data?.detail || loginError?.message

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-2) 55%, var(--bg-3) 100%)' }}>
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 animate-float1" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-15 animate-float2" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(120px)' }} />
        <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full opacity-10 animate-float3" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', filter: 'blur(120px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="white" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#f0f4ff]">AAIE</h1>
          <p className="text-[#94a3b8] mt-1">Academic AI Intervention Engine</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--shadow), var(--inset)' }}>
          <h2 className="text-xl font-semibold text-[#f0f4ff] mb-6">Sign in to your account</h2>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-xl px-4 py-3 mb-4 text-sm text-[#ef4444] border border-[rgba(239,68,68,0.3)]"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              {errorMsg}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@university.edu"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn-primary w-full py-3 text-base font-semibold"
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/[0.08]">
            <p className="text-xs text-[#475569] text-center">
              Demo accounts — Admin: admin@aaie.edu / Admin@123 · Staff: staff1@aaie.edu / Staff@123
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
