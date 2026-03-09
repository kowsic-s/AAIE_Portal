import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getStudentDashboard } from '../../api/student'
import KpiCard from '../../components/KpiCard'
import RiskBadge from '../../components/RiskBadge'
import useAuthStore from '../../store/authStore'
import { motion } from 'framer-motion'

const StudentDashboard = () => {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: getStudentDashboard,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <Skeleton />
  if (isError) return <div className="text-[#ef4444] p-6">Failed to load dashboard.</div>

  const d = data?.data ?? {}
  const pred = d.latest_prediction ?? {}
  const perf = d.latest_performance ?? {}
  const student = d.student ?? {}

  const riskMessages = {
    Low: 'You are on track. Keep maintaining your excellent academic performance!',
    Medium: 'You have areas to improve. Consider reaching out to your mentor for guidance.',
    High: 'You need immediate support. Please contact your academic advisor as soon as possible.',
  }

  const riskColorMap = {
    Low: { border: 'border-[rgba(16,185,129,0.3)]', bg: 'rgba(16,185,129,0.06)' },
    Medium: { border: 'border-[rgba(245,158,11,0.3)]', bg: 'rgba(245,158,11,0.06)' },
    High: { border: 'border-[rgba(239,68,68,0.3)]', bg: 'rgba(239,68,68,0.06)' },
  }

  const risk = pred.risk_level ?? 'Medium'
  const rc = riskColorMap[risk] ?? riskColorMap.Medium

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">Hello, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-[#94a3b8] mt-1">Here's your academic overview</p>
      </div>

      {/* Risk Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card ${rc.border} border`}
        style={{ background: rc.bg }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-[#94a3b8] mb-1">Current Risk Level</p>
            <RiskBadge level={risk} size="lg" />
            <p className="text-[#94a3b8] mt-3 text-sm leading-relaxed">{riskMessages[risk] ?? riskMessages.Medium}</p>
          </div>
          <div className="text-right ml-4">
            <p className="text-sm text-[#94a3b8]">Confidence</p>
            <p className="text-2xl font-bold text-[#f0f4ff]">
              {pred.confidence != null ? `${(pred.confidence * 100).toFixed(0)}%` : '—'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Placement Card */}
      <div className={`card flex items-center gap-4 border ${pred.placement_eligible ? 'border-[rgba(16,185,129,0.3)]' : 'border-white/10'}`}
        style={{ background: pred.placement_eligible ? 'rgba(16,185,129,0.06)' : undefined }}>
        <div className="text-3xl">{pred.placement_eligible ? '✅' : '📋'}</div>
        <div>
          <p className="font-semibold text-[#f0f4ff]">Placement Eligibility</p>
          <p className="text-sm text-[#94a3b8]">
            {pred.placement_eligible
              ? 'You are currently eligible for placement opportunities.'
              : 'You do not meet placement eligibility criteria yet.'}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="GPA" value={perf.gpa ?? 0} icon="📊" color="blue" decimals={2} />
        <KpiCard label="Attendance" value={perf.attendance_pct ?? 0} icon="📅" color="green" decimals={1} suffix="%" />
        <KpiCard label="Reward Points" value={perf.reward_points ?? 0} icon="🏆" color="amber" />
        <KpiCard label="Activity Points" value={perf.activity_points ?? 0} icon="⚡" color="purple" />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/student/performance', icon: '📈', label: 'View Performance History' },
          { to: '/student/what-if', icon: '🔮', label: 'What-If Simulator' },
          { to: '/student/recommendations', icon: '✨', label: 'AI Recommendations' },
        ].map((link) => (
          <Link key={link.to} to={link.to} className="card hover:bg-white/[0.08] transition-all flex items-center gap-3 group">
            <span className="text-2xl">{link.icon}</span>
            <span className="font-medium text-[#94a3b8] group-hover:text-[#3b82f6] transition-colors">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

const Skeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-white/[0.08] rounded w-48" />
    <div className="h-28 bg-white/[0.08] rounded-xl" />
    <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-24 bg-white/[0.08] rounded-xl" />)}</div>
  </div>
)

export default StudentDashboard
