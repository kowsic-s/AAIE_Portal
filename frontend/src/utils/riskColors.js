export const riskColors = {
  Low: {
    bg: 'bg-[rgba(16,185,129,0.12)]',
    text: 'text-[#10b981]',
    border: 'border-[rgba(16,185,129,0.3)]',
    dot: 'bg-[#10b981]',
    hex: '#10b981',
  },
  Medium: {
    bg: 'bg-[rgba(245,158,11,0.12)]',
    text: 'text-[#f59e0b]',
    border: 'border-[rgba(245,158,11,0.3)]',
    dot: 'bg-[#f59e0b]',
    hex: '#f59e0b',
  },
  High: {
    bg: 'bg-[rgba(239,68,68,0.12)]',
    text: 'text-[#ef4444]',
    border: 'border-[rgba(239,68,68,0.3)]',
    dot: 'bg-[#ef4444]',
    hex: '#ef4444',
  },
}

export const getRiskColor = (risk) => riskColors[risk] || riskColors.Low

export const RECHARTS_RISK_COLORS = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444',
}
