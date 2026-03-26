import { getRiskColor } from '../utils/riskColors.js'

const RiskBadge = ({ level, risk_level, size = 'md' }) => {
  const riskLevel = level ?? risk_level
  const colors = getRiskColor(riskLevel)
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {riskLevel || '—'}
    </span>
  )
}

export default RiskBadge
