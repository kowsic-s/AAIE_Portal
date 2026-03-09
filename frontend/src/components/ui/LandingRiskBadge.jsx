export default function LandingRiskBadge({ level }) {
  const cfg = {
    High:   { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: 'rgba(248,113,113,0.25)' },
    Medium: { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
    Low:    { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', border: 'rgba(52,211,153,0.25)' },
  }
  const c = cfg[level] || cfg.Low
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1
                 rounded-full font-display text-[0.67rem] font-bold"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
        style={{ background: c.color }} />
      {level}
    </span>
  )
}
