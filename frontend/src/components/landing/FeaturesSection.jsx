import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '../../lib/motionVariants.js'
import SectionLabel from './SectionLabel.jsx'

const FEATURES = [
  {
    name: 'ML Risk Prediction',
    desc: 'Random Forest and Decision Tree models auto-compete via cross-validation. Best model wins and predicts with confidence scores.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
  },
  {
    name: 'Gemini AI Recommendations',
    desc: 'Google Gemini generates personalised, actionable improvement plans for each student based on their unique risk profile.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    name: 'Role-Based Portals',
    desc: 'Three separate portals — Admin, Staff, and Student — each with strict data isolation and role-appropriate views.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    name: 'What-If Simulator',
    desc: 'Students simulate metric improvements via sliders and see real-time projected risk level changes — instant, no DB writes.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    name: 'Bulk CSV Upload',
    desc: 'Upload student and staff records in batch. Auto-generates credentials, validates rows, and reports per-row errors clearly.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    name: 'Intervention Tracking',
    desc: 'Staff log counselling, parent meetings, academic support, and warnings. Full lifecycle: Open → In Progress → Closed.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-[100px] border-y border-[var(--lp-border)]"
      style={{ background: 'var(--lp-bg-2)' }}>
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <SectionLabel text="Capabilities" centered />
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-[var(--lp-text-1)] mb-3">
            Everything your institution needs
          </h2>
          <p className="text-base text-[var(--lp-text-2)] leading-relaxed max-w-[520px] mx-auto">
            Purpose-built features for admins, staff, and students — all in one platform.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.name}
              variants={staggerItem}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="lp-glass lp-glass-hover p-7 group cursor-default"
            >
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-5
                transition-all duration-300
                bg-[var(--lp-surface-2)] border border-[var(--lp-border)]
                text-[var(--lp-text-2)]
                group-hover:bg-gradient-to-br group-hover:from-[#4f8ef7] group-hover:to-[#7c6af7]
                group-hover:shadow-glow-blue group-hover:border-transparent group-hover:text-white">
                {f.icon}
              </div>
              <h3 className="font-display text-base font-bold text-[var(--lp-text-1)] mb-2">{f.name}</h3>
              <p className="font-body text-[0.875rem] text-[var(--lp-text-2)] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
