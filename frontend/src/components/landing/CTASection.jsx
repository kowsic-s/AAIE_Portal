import { motion } from 'framer-motion'
import GlassCard from '../ui/GlassCard.jsx'

export default function CTASection() {
  return (
    <section className="py-[120px]">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <GlassCard
          topAccent
          topAccentGradient="from-[#4f8ef7] via-[#7c6af7] to-[#22d3ee]"
          animate
          hover={false}
          className="max-w-[780px] mx-auto px-7 sm:px-16 py-12 sm:py-[72px] text-center"
        >
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-[var(--lp-text-1)] mb-4">
            Ready to protect<br />every student's future?
          </h2>
          <p className="text-base text-[var(--lp-text-2)] mb-10 leading-relaxed">
            AAIE gives your institution the intelligence to act early, every time.
          </p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <motion.a
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
              href="#portals"
              className="inline-flex items-center gap-2 font-body font-semibold text-base
                         rounded-xl px-6 py-3 transition-all duration-200 cursor-pointer no-underline
                         bg-gradient-to-br from-[#4f8ef7] to-[#7c6af7] text-white
                         shadow-[0_6px_24px_rgba(79,142,247,0.25)]
                         hover:shadow-[0_10px_32px_rgba(79,142,247,0.35)]
                         border border-[rgba(79,142,247,0.4)]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Access a Portal
            </motion.a>
            <motion.a
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
              href="#how"
              className="inline-flex items-center gap-2 font-body font-semibold text-base
                         rounded-xl px-6 py-3 transition-all duration-200 cursor-pointer no-underline
                         bg-transparent border border-[var(--lp-border)]
                         text-[var(--lp-text-2)] hover:bg-[var(--lp-surface-2)]
                         hover:text-[var(--lp-text-1)]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="5 12 19 12" /><polyline points="12 5 19 12 12 19" />
              </svg>
              View documentation
            </motion.a>
          </div>
        </GlassCard>
      </div>
    </section>
  )
}
