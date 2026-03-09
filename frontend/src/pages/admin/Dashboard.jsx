import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getAdminDashboard } from '../../api/admin'
import KpiCard from '../../components/KpiCard'
import RiskDistributionChart from '../../components/charts/RiskDistributionChart'
import DataTable from '../../components/DataTable'
import RiskBadge from '../../components/RiskBadge'
import { formatDate } from '../../utils/formatters'

const AUDIT_COLUMNS = [
  { key: 'action', label: 'Action' },
  { key: 'entity_type', label: 'Entity' },
  { key: 'ip_address', label: 'IP' },
  { key: 'created_at', label: 'When', render: (v) => formatDate(v) },
]

const TOP_RISK_COLUMNS = [
  { key: 'student_code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'department', label: 'Dept' },
  { key: 'gpa', label: 'GPA' },
  { key: 'attendance_pct', label: 'Attend %' },
  { key: 'risk_level', label: 'Risk', render: (v) => <RiskBadge level={v} /> },
]

const AdminDashboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
    staleTime: 2 * 60 * 1000,
  })

  if (isLoading) return <DashboardSkeleton />
  if (isError) return <div className="text-[#ef4444] p-6">Failed to load dashboard data.</div>

  const d = data?.data ?? {}
  const kpis = d.kpis ?? {}
  const riskDist = d.risk_distribution ?? {}
  const topRisk = d.top_risk_students ?? []
  const auditLogs = d.recent_audit_logs ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">Admin Dashboard</h1>
        <p className="text-[#94a3b8] mt-1">Institution-wide overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Students" value={kpis.total_students ?? 0} icon="👨‍🎓" color="blue" />
        <KpiCard label="High Risk" value={kpis.high_risk_count ?? 0} icon="⚠️" color="red" />
        <KpiCard label="Total Staff" value={kpis.total_staff ?? 0} icon="👨‍🏫" color="amber" />
        <KpiCard label="Avg GPA" value={kpis.avg_gpa ?? 0} icon="📊" color="green" decimals={2} />
      </div>

      {/* Charts + Top Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-[#f0f4ff] mb-4">Risk Distribution</h2>
          <RiskDistributionChart data={riskDist} />
        </div>
        <div className="card">
          <h2 className="font-semibold text-[#f0f4ff] mb-4">Top 10 At-Risk Students</h2>
          <DataTable
            columns={TOP_RISK_COLUMNS}
            data={topRisk}
            pageSize={10}
            searchable={false}
          />
        </div>
      </div>

      {/* Audit Log */}
      <div className="card">
        <h2 className="font-semibold text-[#f0f4ff] mb-4">Recent Audit Logs</h2>
        <DataTable columns={AUDIT_COLUMNS} data={auditLogs} pageSize={8} />
      </div>
    </div>
  )
}

const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-white/[0.08] rounded w-64" />
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-white/[0.08] rounded-xl" />)}
    </div>
    <div className="grid grid-cols-2 gap-6">
      <div className="h-64 bg-white/[0.08] rounded-xl" />
      <div className="h-64 bg-white/[0.08] rounded-xl" />
    </div>
  </div>
)

export default AdminDashboard
