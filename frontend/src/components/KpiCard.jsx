import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'

const Counter = ({ value, decimals = 0 }) => {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) =>
    decimals > 0 ? latest.toFixed(decimals) : Math.round(latest)
  )

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: 'easeOut' })
    return controls.stop
  }, [value])

  return <motion.span>{rounded}</motion.span>
}

const KpiCard = ({ title, label, value, subtitle, icon, color = 'blue', trend, decimals, suffix }) => {
  const cardLabel = label ?? title
  const colorMap = {
    blue: { bg: 'rgba(59,130,246,0.12)', text: '#2563eb' },
    green: { bg: 'rgba(16,185,129,0.12)', text: '#059669' },
    amber: { bg: 'rgba(245,158,11,0.12)', text: '#d97706' },
    red: { bg: 'rgba(239,68,68,0.12)', text: '#dc2626' },
    purple: { bg: 'rgba(139,92,246,0.12)', text: '#6d28d9' },
  }
  const tone = colorMap[color] || colorMap.blue

  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))
  const resolvedDecimals = decimals ?? (Number.isInteger(numericValue) ? 0 : 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-6 flex items-start gap-4 border"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow), var(--inset)',
      }}
    >
      {icon && (
        <div className="p-3 rounded-xl flex-shrink-0 text-lg" style={{ background: tone.bg, color: tone.text }}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-2)' }}>{cardLabel}</p>
        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-1)' }}>
          {isNumeric ? (
            <><Counter value={numericValue} decimals={resolvedDecimals} />{suffix && <span className="text-base font-normal ml-0.5" style={{ color: 'var(--text-2)' }}>{suffix}</span>}</>
          ) : value}
        </p>
        {subtitle && <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{subtitle}</p>}
        {trend !== undefined && (
          <p
            className="text-xs mt-1 font-medium"
            style={{ color: trend >= 0 ? 'var(--risk-low)' : 'var(--risk-high)' }}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default KpiCard
