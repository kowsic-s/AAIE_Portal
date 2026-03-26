import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { fadeUp, fadeIn } from '../../lib/motionVariants.js'
import { useCountUp } from '../../hooks/useCountUp.js'
import GlassCard from '../ui/GlassCard.jsx'
import LandingRiskBadge from '../ui/LandingRiskBadge'

const STUDENTS = [
  { initials: 'AK', gradient: 'from-[#f87171] to-[#fb923c]', name: 'Arjun Kumar', level: 'High' },
  { initials: 'PS', gradient: 'from-[#f59e0b] to-[#f87171]', name: 'Priya Singh', level: 'Medium' },
  { initials: 'RV', gradient: 'from-[#34d399] to-[#22d3ee]', name: 'Ravi Verma', level: 'Low' },
]

const RISK_BARS = [
  { label: 'High', pct: '22%', color: 'var(--lp-risk-high)', shadow: 'shadow-glow-red' },
  { label: 'Med', pct: '35%', color: 'var(--lp-risk-medium)', shadow: 'shadow-glow-amber' },
  { label: 'Low', pct: '43%', color: 'var(--lp-risk-low)', shadow: 'shadow-glow-green' },
]

export default function HeroSection({ stats = {} }) {
  const barsRef = useRef(null)
  const barsInView = useInView(barsRef, { once: true, amount: 0.3 })

  const totalStudents = useCountUp(stats?.totalStudents || 1284, 1400)
  const departments = useCountUp(stats?.departments || 3, 800)

  return (
    <section className="min-h-screen flex items-center pt-[120px] pb-[80px]">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* LEFT — Content */}
          <div>
            {/* Label pill */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={0.1}
              className="inline-flex items-center gap-2 text-[0.75rem] font-display font-semibold uppercase tracking-[0.08em]
                         text-[var(--lp-accent)] bg-[var(--lp-surface)] border border-[var(--lp-border)]
                         px-3.5 py-1.5 rounded-full w-fit mb-6"
            >
              <span className="w-1.5 h-1.5 bg-[var(--lp-accent)] rounded-full animate-pulse-dot" />
              AI-Powered Academic Intelligence
            </motion.div>

            {/* H1 */}
            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={0.2}
              className="font-display text-[clamp(2.8rem,5vw,4.2rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-[var(--lp-text-1)] mb-6"
            >
              <span className="block">Identify risk.</span>
              <span className="block lp-gradient-text">Intervene early.</span>
              <span className="block">Save futures.</span>
            </motion.h1>

            {/* Paragraph */}
            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={0.35}
              className="font-body text-[1.05rem] text-[var(--lp-text-2)] leading-[1.7] max-w-[480px] mb-10"
            >
              AAIE uses machine learning to continuously monitor student performance,
              predict academic risk, and enable timely interventions — before it's too late.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={0.5}
              className="flex gap-3.5 items-center flex-wrap"
            >
              <motion.a
                whileHover={{ y: -1 }} whileTap={{ y: 0 }}
                href="#portals"
                className="inline-flex items-center gap-2 font-body font-semibold text-base
                           rounded-xl px-6 py-3 transition-all duration-200 cursor-pointer no-underline
                           bg-gradient-to-br from-[#4f8ef7] to-[#7c6af7] text-white
                           shadow-[0_6px_24px_rgba(79,142,247,0.25)]
                           hover:shadow-[0_10px_32px_rgba(79,142,247,0.35)]
                           border border-[rgba(79,142,247,0.4)]"
              >
                Access Portal
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="5 12 19 12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </motion.a>
              <motion.a
                whileHover={{ y: -1 }} whileTap={{ y: 0 }}
                href="#how"
                className="inline-flex items-center gap-2 font-body font-semibold text-base
                           rounded-xl px-6 py-3 transition-all duration-200 cursor-pointer no-underline
                           bg-transparent border border-[var(--lp-border)]
                           text-[var(--lp-text-2)] hover:bg-[var(--lp-surface-2)]
                           hover:text-[var(--lp-text-1)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                See how it works
              </motion.a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={0.65}
              className="mt-12 pt-10 border-t border-[var(--lp-border)] flex gap-8 flex-wrap"
            >
              {[
                { value: totalStudents.toLocaleString(), label: 'Students Monitored' },
                { value: '<500ms', label: 'Prediction Time' },
                { value: departments, label: 'User Portals' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-1">
                  <span className="font-display text-[1.6rem] font-bold text-[var(--lp-text-1)] tracking-[-0.02em]">
                    {s.value}
                  </span>
                  <span className="text-[0.8rem] text-[var(--lp-text-3)] font-medium">{s.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — Dashboard Visual */}
          <motion.div
            variants={fadeIn} initial="hidden" animate="visible" custom={0.4}
            className="relative hidden lg:block"
          >
            {/* Floating Card B — top right */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="lp-glass rounded-[14px] p-4 w-[160px] border border-[var(--lp-border-2)] absolute top-[-20px] right-[-20px] z-10"
            >
              <p className="text-[0.65rem] uppercase tracking-wide text-[var(--lp-text-3)] font-display font-semibold">Model Confidence</p>
              <p className="font-display text-[1.4rem] font-bold text-[var(--lp-text-1)]">87.4%</p>
              <p className="text-[0.7rem] text-[var(--lp-risk-low)] font-semibold">↑ High confidence</p>
            </motion.div>

            {/* Main Dashboard Card */}
            <GlassCard topAccent topAccentGradient="from-[#4f8ef7] via-[#7c6af7] to-[#22d3ee]" hover={false} className="relative z-[1] p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <span className="font-display text-[0.875rem] font-bold text-[var(--lp-text-1)]">Institution Dashboard</span>
                <span className="text-[0.7rem] font-display font-semibold px-2.5 py-0.5 rounded-full
                  bg-[rgba(34,211,238,0.12)] border border-[rgba(34,211,238,0.25)] text-[var(--lp-accent-3)]">
                  Live
                </span>
              </div>

              {/* KPI mini grid */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { value: stats?.totalStudents?.toLocaleString() || '1,284', label: 'Students', sub: '↑ 12 enrolled', subColor: 'var(--lp-risk-low)' },
                  { value: stats?.atRisk || '142', label: 'At Risk', sub: '↑ 8 new', subColor: 'var(--lp-risk-high)' },
                  { value: stats?.interventions || '38', label: 'Interventions', sub: '12 open', subColor: 'var(--lp-risk-medium)' },
                ].map((k) => (
                  <div key={k.label} className="bg-[var(--lp-surface-2)] border border-[var(--lp-border)] rounded-[12px] p-3.5">
                    <p className="font-display text-[1.4rem] font-bold text-[var(--lp-text-1)]">{k.value}</p>
                    <p className="text-[0.7rem] text-[var(--lp-text-3)]">{k.label}</p>
                    <p className="text-[0.65rem] font-semibold mt-1" style={{ color: k.subColor }}>{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Risk Bars */}
              <div ref={barsRef} className="flex flex-col gap-2.5 mb-5">
                {RISK_BARS.map((b, i) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="text-[0.75rem] text-[var(--lp-text-2)] w-[50px]">{b.label}</span>
                    <div className="flex-1 h-[6px] rounded-full bg-[var(--lp-surface-3)]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={barsInView ? { width: b.pct } : { width: 0 }}
                        transition={{ duration: 1.5, delay: 1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${b.shadow}`}
                        style={{ background: b.color }}
                      />
                    </div>
                    <span className="text-[0.7rem] text-[var(--lp-text-3)] w-[30px] text-right">{b.pct}</span>
                  </div>
                ))}
              </div>

              {/* Student mini list */}
              <div className="flex flex-col gap-2">
                {STUDENTS.map((s) => (
                  <div key={s.name} className="flex items-center gap-2.5 p-2.5 rounded-[10px]
                    bg-[var(--lp-surface-2)] border border-[var(--lp-border)]
                    hover:border-[var(--lp-border-2)] transition-colors cursor-default">
                    <div className={`w-7 h-7 rounded-[8px] bg-gradient-to-br ${s.gradient} flex items-center justify-center
                      font-display text-[0.7rem] font-bold text-white`}>
                      {s.initials}
                    </div>
                    <span className="flex-1 text-[0.78rem] font-medium text-[var(--lp-text-1)]">{s.name}</span>
                    <LandingRiskBadge level={s.level} />
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Floating Card A — bottom right */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="lp-glass rounded-[14px] p-4 w-[180px] absolute bottom-[-28px] right-[-28px] z-10"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-[#4f8ef7] to-[#7c6af7] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <p className="text-[0.72rem] font-bold text-[var(--lp-text-1)]">Gemini AI</p>
                  <p className="text-[0.65rem] text-[var(--lp-text-3)] leading-snug">Recommendation ready</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
