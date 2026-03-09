import { motion } from 'framer-motion'

export default function GlassCard({
  children,
  className = '',
  hover = true,
  glow = null,
  animate = false,
  delay = 0,
  topAccent = false,
  topAccentGradient = 'from-[#4f8ef7] to-[#7c6af7]',
}) {
  const glowMap = {
    blue: 'shadow-glow-blue',
    green: 'shadow-glow-green',
    red: 'shadow-glow-red',
    amber: 'shadow-glow-amber',
  }
  const cls = `
    lp-glass relative overflow-hidden
    ${hover ? 'lp-glass-hover cursor-default' : ''}
    ${glow ? glowMap[glow] : ''}
    ${className}
  `
  const accent = topAccent && (
    <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${topAccentGradient}`} />
  )

  if (!animate) {
    return (
      <div className={cls}>
        {accent}
        {children}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cls}
    >
      {accent}
      {children}
    </motion.div>
  )
}
