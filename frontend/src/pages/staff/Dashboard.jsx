import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getStaffDashboard } from '../../api/staff'
import KpiCard from '../../components/KpiCard'
import RiskDistributionChart from '../../components/charts/RiskDistributionChart'
import RiskBadge from '../../components/RiskBadge'
import useAuthStore from '../../store/authStore'

const StaffDashboard = () => {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['staff-dashboard'],
    queryFn: getStaffDashboard,
    staleTime: 2 * 60 * 1000,
  })

  if (isLoading) return <Skeleton />
  if (isError) return <div className="text-[#ef4444] p-6">Failed to load dashboard.</div>

  const d = data?.data ?? {}
  const kpis = d.kpis ?? {}
  const riskDist = d.risk_distribution ?? {}
  const recentChanges = d.recent_risk_changes ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">Welcome, {user?.name?.split(' ')[0]}</h1>
        <p className="text-[#94a3b8] mt-1">Department overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="My Students" value={kpis.total_students ?? 0} icon="👨‍🎓" color="blue" />
        <KpiCard label="High Risk" value={kpis.high_risk ?? 0} icon="⚠️" color="red" />
        <KpiCard label="Interventions Open" value={kpis.open_interventions ?? 0} icon="📋" color="amber" />
        <KpiCard label="Avg GPA" value={kpis.avg_gpa ?? 0} icon="📊" color="green" decimals={2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-[#f0f4ff] mb-4">Risk Distribution</h2>
          <RiskDistributionChart data={riskDist} />
        </div>
        <div className="card">
          <h2 className="font-semibold text-[#f0f4ff] mb-4">Recent Risk Changes</h2>
          {recentChanges.length === 0 ? (
            <p className="text-[#475569] text-sm">No recent changes.</p>
          ) : (
            <div className="space-y-3">
              {recentChanges.map((c) => (
                <Link
                  key={c.student_id}
                  to={`/staff/students/${c.student_id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
                >
                  <div>
                    <p className="font-medium text-[#f0f4ff] text-sm">{c.name}</p>
                    <p className="text-xs text-[#475569]">{c.student_code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiskBadge level={c.previous_risk} size="sm" />
                    <span className="text-[#475569]">→</span>
                    <RiskBadge level={c.current_risk} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Skeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-white/[0.08] rounded w-48" />
    <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-24 bg-white/[0.08] rounded-xl" />)}</div>
    <div className="grid grid-cols-2 gap-6"><div className="h-56 bg-white/[0.08] rounded-xl" /><div className="h-56 bg-white/[0.08] rounded-xl" /></div>
  </div>
)

export default StaffDashboard
