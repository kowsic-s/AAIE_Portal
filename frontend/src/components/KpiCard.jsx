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
    blue: 'bg-[rgba(59,130,246,0.12)] text-[#3b82f6]',
    green: 'bg-[rgba(16,185,129,0.12)] text-[#10b981]',
    amber: 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]',
    red: 'bg-[rgba(239,68,68,0.12)] text-[#ef4444]',
    purple: 'bg-[rgba(139,92,246,0.12)] text-[#8b5cf6]',
  }

  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))
  const resolvedDecimals = decimals ?? (Number.isInteger(numericValue) ? 0 : 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-6 flex items-start gap-4 border border-white/10"
      style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)' }}
    >
      {icon && (
        <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.blue} flex-shrink-0 text-lg`}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#94a3b8] truncate">{cardLabel}</p>
        <p className="text-2xl font-bold text-[#f0f4ff] mt-1">
          {isNumeric ? (
            <><Counter value={numericValue} decimals={resolvedDecimals} />{suffix && <span className="text-base font-normal text-[#94a3b8] ml-0.5">{suffix}</span>}</>
          ) : value}
        </p>
        {subtitle && <p className="text-xs text-[#475569] mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default KpiCard
