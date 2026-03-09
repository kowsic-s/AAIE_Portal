import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { fadeUp } from '../../lib/motionVariants'
import GlassCard from '../ui/GlassCard'
import SectionLabel from './SectionLabel'

const FEATURE_BARS = [
  { label: 'Attendance %', width: '82%', importance: '0.82' },
  { label: 'GPA', width: '74%', importance: '0.74' },
  { label: 'Reward Points', width: '45%', importance: '0.45' },
  { label: 'Activity Pts', width: '32%', importance: '0.32' },
]

const POINTS = [
  {
    title: 'RobustScaler Preprocessing',
    desc: 'Handles outliers using median and IQR — resistant to extreme values like 0% attendance.',
    bg: 'rgba(79,142,247,0.12)',
    border: 'rgba(79,142,247,0.2)',
    color: '#4f8ef7',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
      </svg>
    ),
  },
  {
    title: 'Balanced Class Weights',
    desc: "class_weight='balanced' prevents ignoring at-risk minority classes in imbalanced datasets.",
    bg: 'rgba(124,106,247,0.12)',
    border: 'rgba(124,106,247,0.2)',
    color: '#7c6af7',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: 'Placement Eligibility',
    desc: "Secondary output alongside risk — students know their placement status and what metrics are holding them back.",
    bg: 'rgba(34,211,238,0.12)',
    border: 'rgba(34,211,238,0.2)',
    color: '#22d3ee',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
]

export default function MLSection() {
  const barsRef = useRef(null)
  const barsInView = useInView(barsRef, { once: true, amount: 0.3 })

  return (
    <section id="ml" className="py-[100px] border-y border-[var(--lp-border)]"
      style={{ background: 'var(--lp-bg-2)' }}>
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* LEFT — ML visual */}
          <GlassCard topAccent topAccentGradient="from-[#22d3ee] via-[#4f8ef7] to-[#7c6af7]" hover={false} className="p-8">
            <h3 className="font-display text-[0.875rem] font-bold text-[var(--lp-text-1)] mb-5">ML Engine — Active Model</h3>

            {/* Model comparison */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="border border-[var(--lp-accent)] shadow-glow-blue bg-[var(--lp-surface-2)] rounded-[12px] p-3.5 text-center">
                <p className="text-[0.75rem] font-bold text-[var(--lp-text-1)]">Random Forest</p>
                <p className="text-[0.7rem] text-[var(--lp-accent)] font-semibold mt-0.5">91.2% Recall</p>
                <p className="text-[0.65rem] text-[var(--lp-text-3)] mt-0.5">Active Model</p>
              </div>
              <div className="border border-[var(--lp-border)] bg-[var(--lp-surface-2)] rounded-[12px] p-3.5 text-center">
                <p className="text-[0.75rem] font-bold text-[var(--lp-text-1)]">Decision Tree</p>
                <p className="text-[0.7rem] text-[var(--lp-text-2)] font-semibold mt-0.5">87.8% Recall</p>
                <p className="text-[0.65rem] text-[var(--lp-text-3)] mt-0.5">Challenger</p>
              </div>
            </div>

            {/* Feature importance */}
            <p className="text-[0.72rem] uppercase tracking-widest text-[var(--lp-text-3)] mb-3">Feature Importance</p>
            <div ref={barsRef} className="flex flex-col gap-2.5">
              {FEATURE_BARS.map((b, i) => (
                <div key={b.label} className="flex items-center gap-3.5">
                  <span className="text-[0.78rem] text-[var(--lp-text-2)] w-[120px]">{b.label}</span>
                  <div className="flex-1 h-[6px] rounded-full bg-[var(--lp-surface-3)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={barsInView ? { width: b.width } : { width: 0 }}
                      transition={{ duration: 1.5, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-[#4f8ef7] to-[#7c6af7]"
                    />
                  </div>
                  <span className="text-[0.7rem] text-[var(--lp-text-3)] w-8 text-right">{b.importance}</span>
                </div>
              ))}
            </div>

            {/* Confidence */}
            <div className="mt-5 pt-5 border-t border-[var(--lp-border)] flex items-center justify-between">
              <span className="text-[0.78rem] text-[var(--lp-text-2)]">Avg Prediction Confidence</span>
              <span className="font-display text-[1.1rem] font-bold text-[var(--lp-risk-low)]">87.4%</span>
            </div>
          </GlassCard>

          {/* RIGHT — Copy content */}
          <div>
            <SectionLabel text="Intelligence" />
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-[var(--lp-text-1)] mb-3">
              ML engine that<br />selects itself
            </h2>
            <p className="text-base text-[var(--lp-text-2)] leading-relaxed mb-8">
              Both models train simultaneously. 5-fold cross-validation picks the winner by macro recall
              — because missing an at-risk student is never acceptable.
            </p>

            <div className="flex flex-col gap-4">
              {POINTS.map((pt, i) => (
                <motion.div
                  key={pt.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={0.1 + i * 0.1}
                  className="flex gap-3.5 items-start"
                >
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: pt.bg, border: `1px solid ${pt.border}`, color: pt.color }}>
                    {pt.icon}
                  </div>
                  <div>
                    <h4 className="font-display text-[0.875rem] font-bold text-[var(--lp-text-1)] mb-1">{pt.title}</h4>
                    <p className="text-[0.82rem] text-[var(--lp-text-2)] leading-relaxed">{pt.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
