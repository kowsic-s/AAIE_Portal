import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { useRef } from 'react'
import { staggerContainer, staggerItem } from '../../lib/motionVariants.js'
import GlassCard from '../ui/GlassCard.jsx'
import SectionLabel from './SectionLabel'

const STEPS = [
  {
    num: '01',
    title: 'Collect & Monitor',
    desc: 'Continuously track attendance, GPA, reward points, and activity points. Staff upload records via CSV or direct entry.',
  },
  {
    num: '02',
    title: 'Predict Risk Level',
    desc: 'ML engine (Random Forest or Decision Tree, auto-selected via cross-validation) classifies each student as Low, Medium, or High risk with a confidence score.',
  },
  {
    num: '03',
    title: 'Intervene & Recommend',
    desc: 'Staff log structured interventions. Google Gemini generates personalised AI recommendations for each student based on their unique risk profile.',
  },
]

function CollectPanel() {
  const metrics = [
    { name: 'Attendance', val: '78.5%', bg: 'rgba(79,142,247,0.12)', border: 'rgba(79,142,247,0.2)', color: '#4f8ef7' },
    { name: 'GPA', val: '6.2 / 10', bg: 'rgba(124,106,247,0.12)', border: 'rgba(124,106,247,0.2)', color: '#7c6af7' },
    { name: 'Reward Pts', val: '145 pts', bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.2)', color: '#22d3ee' },
    { name: 'Activity Pts', val: '88 pts', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.2)', color: '#34d399' },
  ]
  const icons = [
    <svg key="a" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor"/><circle cx="12" cy="7" r="4" stroke="currentColor"/></svg>,
    <svg key="b" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor"/></svg>,
    <svg key="c" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor"/></svg>,
    <svg key="d" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor"/></svg>,
  ]
  return (
    <div>
      <p className="text-[0.8rem] font-display uppercase tracking-widest text-[var(--lp-text-2)] mb-4">Performance Metrics</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {metrics.map((m, i) => (
          <div key={m.name} className="flex items-center gap-3 p-4 rounded-[12px] bg-[var(--lp-surface-2)] border border-[var(--lp-border)]">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center"
              style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.color }}>
              {icons[i]}
            </div>
            <div>
              <p className="text-[0.75rem] font-semibold text-[var(--lp-text-1)]">{m.name}</p>
              <p className="text-[0.7rem] text-[var(--lp-text-3)]">{m.val}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2.5 p-3 rounded-[12px] bg-[var(--lp-surface-2)] border border-[var(--lp-border)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--lp-accent)" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span className="text-[0.78rem] text-[var(--lp-text-2)] flex-1">CSV upload — 486 records processed</span>
        <span className="text-[0.7rem] text-[var(--lp-risk-low)] font-semibold">✓ Done</span>
      </div>
    </div>
  )
}

function PredictPanel() {
  const barsRef = useRef(null)
  const inView = useInView(barsRef, { once: true, amount: 0.3 })
  const bars = [
    { label: 'P(Low)', width: '8%', color: 'var(--lp-risk-low)' },
    { label: 'P(Medium)', width: '19%', color: 'var(--lp-risk-medium)' },
    { label: 'P(High)', width: '73%', color: 'var(--lp-risk-high)' },
  ]
  return (
    <div>
      <p className="text-[0.8rem] font-display uppercase tracking-widest text-[var(--lp-text-2)] mb-4">ML Prediction Output</p>
      <div className="p-5 mb-4 rounded-[14px] bg-[var(--lp-surface-2)] border border-[var(--lp-border)] text-center">
        <p className="text-[0.72rem] uppercase tracking-wide text-[var(--lp-text-3)] mb-2">Risk Classification</p>
        <p className="font-display text-[2.4rem] font-extrabold text-[var(--lp-risk-high)] mb-1">HIGH</p>
        <p className="text-[0.78rem]">
          <span className="text-[var(--lp-text-2)]">Confidence: </span>
          <span className="text-[var(--lp-accent)] font-bold">87.4%</span>
        </p>
      </div>
      <div ref={barsRef} className="flex flex-col gap-3">
        {bars.map((b, i) => (
          <div key={b.label} className="flex items-center gap-3">
            <span className="text-[0.75rem] text-[var(--lp-text-2)] w-[65px]">{b.label}</span>
            <div className="flex-1 h-[6px] rounded-full bg-[var(--lp-surface-3)]">
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: b.width } : { width: 0 }}
                transition={{ duration: 1.5, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{ background: b.color }}
              />
            </div>
            <span className="text-[0.7rem] text-[var(--lp-text-3)] w-[30px] text-right">{b.width}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 rounded-[10px] bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] text-[0.78rem] text-[var(--lp-text-2)] leading-relaxed">
        Flagged due to <strong className="text-[var(--lp-risk-high)]">low attendance (52%)</strong>, declining GPA (4.2), and low activity (8 pts).
      </div>
    </div>
  )
}

function IntervenePanel() {
  const items = [
    { dot: '#4f8ef7', type: 'Academic Counselling', status: 'Open', sBg: 'rgba(79,142,247,0.15)', sColor: 'var(--lp-accent)', sBorder: 'rgba(79,142,247,0.3)' },
    { dot: 'var(--lp-risk-medium)', type: 'Parent Meeting', status: 'In Progress', sBg: 'rgba(251,191,36,0.12)', sColor: 'var(--lp-risk-medium)', sBorder: 'rgba(251,191,36,0.25)' },
    { dot: 'var(--lp-risk-low)', type: 'Peer Mentoring', status: 'Closed', sBg: 'rgba(52,211,153,0.12)', sColor: 'var(--lp-risk-low)', sBorder: 'rgba(52,211,153,0.25)' },
  ]
  return (
    <div>
      <p className="text-[0.8rem] font-display uppercase tracking-widest text-[var(--lp-text-2)] mb-4">Active Interventions</p>
      <div className="flex flex-col gap-2.5 mb-4">
        {items.map((item) => (
          <div key={item.type} className="flex items-center gap-3 px-4 py-3.5 rounded-[12px] bg-[var(--lp-surface-2)] border border-[var(--lp-border)]">
            <span className="w-2 h-2 rounded-full" style={{ background: item.dot }} />
            <span className="flex-1 text-[0.8rem] font-semibold text-[var(--lp-text-1)]">{item.type}</span>
            <span className="text-[0.65rem] font-display font-bold px-2 py-0.5 rounded-full"
              style={{ background: item.sBg, color: item.sColor, border: `1px solid ${item.sBorder}` }}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-[12px] bg-[var(--lp-surface-2)] border border-[var(--lp-border)]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-[#4f8ef7] to-[#7c6af7] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <span className="text-[0.75rem] font-semibold text-[var(--lp-text-1)]">AI Recommendation</span>
          <span className="text-[0.65rem] text-[var(--lp-accent)] ml-auto">Gemini</span>
        </div>
        <p className="text-[0.75rem] text-[var(--lp-text-2)] leading-relaxed">
          Focus on increasing attendance to above 75%. Schedule 3 study sessions weekly and engage with peer mentors.
        </p>
      </div>
    </div>
  )
}

const PANELS = [CollectPanel, PredictPanel, IntervenePanel]

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.12 })

  useEffect(() => {
    const id = setInterval(() => setActiveStep((s) => (s + 1) % 3), 4000)
    return () => clearInterval(id)
  }, [])

  const ActivePanel = PANELS[activeStep]

  return (
    <section id="how" className="py-[100px]" ref={sectionRef}>
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        {/* Header */}
        {inView && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
            <SectionLabel text="Process" />
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-[var(--lp-text-1)] mb-3">
              Three steps to<br />early intervention
            </h2>
            <p className="text-base text-[var(--lp-text-2)] leading-relaxed max-w-[520px] mb-0">
              A seamless pipeline from data collection to actionable intervention — automated and intelligent.
            </p>
          </motion.div>
        )}

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* LEFT — Steps list */}
          <motion.div variants={staggerContainer} initial="hidden"
            whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                variants={staggerItem}
                onClick={() => setActiveStep(i)}
                className={`flex gap-6 py-7 cursor-pointer group ${i < STEPS.length - 1 ? 'border-b border-[var(--lp-border)]' : ''}`}
              >
                <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 transition-all duration-300
                  font-display text-sm font-bold
                  ${activeStep === i
                    ? 'bg-gradient-to-br from-[#4f8ef7] to-[#7c6af7] shadow-glow-blue text-white'
                    : 'bg-[var(--lp-surface-2)] border border-[var(--lp-border)] text-[var(--lp-text-3)]'
                  }`}>
                  {step.num}
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-base font-bold text-[var(--lp-text-1)] mb-1.5">{step.title}</h3>
                  <p className="font-body text-[0.875rem] text-[var(--lp-text-2)] leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* RIGHT — Visual panel */}
          <div className="sticky top-[100px] hidden lg:block">
            <GlassCard topAccent topAccentGradient="from-[#4f8ef7] to-[#7c6af7]" hover={false} className="min-h-[360px] p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ActivePanel />
                </motion.div>
              </AnimatePresence>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  )
}
