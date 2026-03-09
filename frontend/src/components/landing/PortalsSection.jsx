import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '../../lib/motionVariants'
import { loginApi } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import GlassCard from '../ui/GlassCard'
import SectionLabel from './SectionLabel'

const PORTALS = [
  {
    id: 'admin',
    band: 'from-[#4f8ef7] to-[#7c6af7]',
    iconBg: 'rgba(79,142,247,0.12)',
    iconBorder: 'rgba(79,142,247,0.20)',
    iconColor: '#4f8ef7',
    roleLabel: 'ADMINISTRATOR',
    labelColor: 'text-[#4f8ef7]',
    name: 'Admin Portal',
    desc: 'Full institutional oversight — manage users, departments, model governance, and system-wide settings.',
    features: [
      'Institution-wide dashboards',
      'User & department management',
      'ML model versioning & governance',
      'Configurable risk thresholds',
      'Bulk CSV upload',
    ],
    dotColor: '#4f8ef7',
    btnGradient: 'linear-gradient(135deg, #4f8ef7, #7c6af7)',
    btnShadow: '0 6px 24px rgba(79,142,247,0.35)',
    btnText: 'Sign in as Admin',
    navigateTo: '/admin/dashboard',
    emailPlaceholder: 'admin@institution.edu',
    Icon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: 'staff',
    band: 'from-[#22d3ee] to-[#4f8ef7]',
    iconBg: 'rgba(34,211,238,0.12)',
    iconBorder: 'rgba(34,211,238,0.20)',
    iconColor: '#22d3ee',
    roleLabel: 'TEACHING STAFF',
    labelColor: 'text-[#22d3ee]',
    name: 'Staff Portal',
    desc: 'Monitor your department students, track risk levels, and manage interventions — in your scoped view.',
    features: [
      'Department risk dashboard',
      'At-risk student monitoring',
      'Intervention creation & tracking',
      'AI-generated recommendations',
      'Academic record CSV upload',
    ],
    dotColor: '#22d3ee',
    btnGradient: 'linear-gradient(135deg, #22d3ee, #4f8ef7)',
    btnShadow: '0 6px 24px rgba(34,211,238,0.35)',
    btnText: 'Sign in as Staff',
    navigateTo: '/staff/dashboard',
    emailPlaceholder: 'staff@institution.edu',
    Icon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'student',
    band: 'from-[#34d399] to-[#22d3ee]',
    iconBg: 'rgba(52,211,153,0.12)',
    iconBorder: 'rgba(52,211,153,0.20)',
    iconColor: '#34d399',
    roleLabel: 'STUDENT',
    labelColor: 'text-[#34d399]',
    name: 'Student Portal',
    desc: 'Track your own performance, simulate improvements, and receive personalised AI recommendations.',
    features: [
      'Personal risk & performance view',
      'GPA & attendance trend charts',
      'What-If metric simulator',
      'AI improvement plan',
      'Placement eligibility status',
    ],
    dotColor: '#34d399',
    btnGradient: 'linear-gradient(135deg, #34d399, #22d3ee)',
    btnShadow: '0 6px 24px rgba(52,211,153,0.35)',
    btnText: 'Sign in as Student',
    btnTextColor: '#0a0f1e',
    navigateTo: '/student/dashboard',
    emailPlaceholder: 'student@institution.edu',
    Icon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
]

function PortalCard({ portal }) {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Email and password required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await loginApi(email, password)
      const { user, access_token, refresh_token } = res.data
      login(user, access_token, refresh_token)
      navigate(portal.navigateTo)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const { Icon } = portal

  return (
    <motion.div variants={staggerItem} whileHover={{ y: -6, transition: { duration: 0.25 } }}>
      <GlassCard className="overflow-hidden" hover={false}>
        {/* Top band */}
        <div className={`h-[4px] bg-gradient-to-r ${portal.band}`} />

        <div className="p-7">
          {/* Icon */}
          <div className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center mb-5"
            style={{ background: portal.iconBg, border: `1px solid ${portal.iconBorder}`, color: portal.iconColor }}>
            <Icon />
          </div>

          <p className={`text-[0.7rem] font-display font-bold uppercase tracking-[0.1em] mb-1.5 ${portal.labelColor}`}>
            {portal.roleLabel}
          </p>
          <h3 className="font-display text-[1.2rem] font-extrabold text-[var(--lp-text-1)] tracking-[-0.02em] mb-2.5">
            {portal.name}
          </h3>
          <p className="text-[0.875rem] text-[var(--lp-text-2)] leading-relaxed mb-6">{portal.desc}</p>

          {/* Features list */}
          <div className="flex flex-col gap-2 mb-7">
            {portal.features.map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: portal.dotColor }} />
                <span className="text-[0.8rem] text-[var(--lp-text-2)]">{f}</span>
              </div>
            ))}
          </div>

          {/* Login form */}
          <div className="bg-[var(--lp-surface-2)] border border-[var(--lp-border)] rounded-[14px] p-5">
            <p className="text-[0.8rem] font-semibold text-[var(--lp-text-2)] mb-3.5">
              Sign in to {portal.name}
            </p>
            <form onSubmit={handleLogin} className="flex flex-col gap-2.5">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lp-text-3)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  placeholder={portal.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-[10px] text-[0.82rem]
                    bg-[var(--lp-surface)] border border-[var(--lp-border)]
                    text-[var(--lp-text-1)] placeholder-[var(--lp-text-3)]
                    focus:border-[var(--lp-accent)] focus:outline-none
                    transition-colors"
                />
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lp-text-3)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-[10px] text-[0.82rem]
                    bg-[var(--lp-surface)] border border-[var(--lp-border)]
                    text-[var(--lp-text-1)] placeholder-[var(--lp-text-3)]
                    focus:border-[var(--lp-accent)] focus:outline-none
                    transition-colors"
                />
              </div>

              {error && (
                <p className="text-[0.75rem] text-[var(--lp-risk-high)] text-center -mb-1">{error}</p>
              )}

              <motion.button
                type="submit"
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                disabled={loading}
                className="w-full py-2.5 rounded-[10px] font-body text-[0.82rem] font-bold
                  flex items-center justify-center gap-1.5 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0"
                style={{
                  background: portal.btnGradient,
                  boxShadow: portal.btnShadow,
                  color: portal.btnTextColor || '#fff',
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="5 12 19 12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                    {portal.btnText}
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

export default function PortalsSection() {
  return (
    <section id="portals" className="py-[100px]">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <SectionLabel text="Access" centered />
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-[var(--lp-text-1)] mb-3">
            Choose your portal
          </h2>
          <p className="text-base text-[var(--lp-text-2)] leading-relaxed max-w-[520px] mx-auto">
            Each portal is purpose-built for its role — with strict data isolation and a tailored experience.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-7 lg:max-w-none max-w-md mx-auto"
        >
          {PORTALS.map((p) => (
            <PortalCard key={p.id} portal={p} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
