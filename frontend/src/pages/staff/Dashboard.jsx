import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getStaffDashboard } from '../../api/staff'
import RiskDistributionChart from '../../components/charts/RiskDistributionChart'
import RiskBadge from '../../components/RiskBadge'

const StaffDashboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['staff-dashboard'],
    queryFn: getStaffDashboard,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  if (isLoading) return <div className="staff-page"><div className="staff-kpi-grid">{[1,2,3,4].map((i) => <div key={i} className="staff-kpi h-28" />)}</div></div>
  if (isError) return <div className="p-6" style={{ color: 'var(--risk-high)' }}>Failed to load dashboard.</div>

  const d = data?.data ?? {}
  const kpis = d.kpis ?? {}
  const recent = d.recent_risk_changes ?? []

  return (
    <div className="staff-page">
      <div className="staff-kpi-grid">
        <div className="staff-kpi">
          <div className="staff-kpi-top"><div className="staff-kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div></div>
          <div className="staff-kpi-value">{kpis.total_students ?? 0}</div>
          <div className="staff-kpi-label">My Students</div>
        </div>
        <div className="staff-kpi">
          <div className="staff-kpi-top"><div className="staff-kpi-icon" style={{ color: 'var(--risk-high)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div></div>
          <div className="staff-kpi-value">{kpis.high_risk_count ?? 0}</div>
          <div className="staff-kpi-label">High Risk</div>
        </div>
        <div className="staff-kpi">
          <div className="staff-kpi-top"><div className="staff-kpi-icon" style={{ color: 'var(--risk-med)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2"/><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg></div></div>
          <div className="staff-kpi-value">{kpis.open_interventions ?? 0}</div>
          <div className="staff-kpi-label">Interventions Open</div>
        </div>
        <div className="staff-kpi">
          <div className="staff-kpi-top"><div className="staff-kpi-icon" style={{ color: 'var(--risk-low)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div></div>
          <div className="staff-kpi-value">{kpis.closed_this_month ?? 0}</div>
          <div className="staff-kpi-label">Closed This Month</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
        <div className="staff-shell">
          <div className="staff-shell-accent" />
          <div className="staff-shell-head">
            <div className="staff-shell-title">Risk Distribution</div>
            <button className="btn-secondary text-xs">Refresh</button>
          </div>
          <div className="p-5"><RiskDistributionChart data={d.risk_distribution ?? {}} /></div>
        </div>

        <div className="staff-shell">
          <div className="staff-shell-accent" />
          <div className="staff-shell-head"><div className="staff-shell-title">Recent Risk Changes</div></div>
          <div className="p-4 space-y-3">
            {recent.length === 0 ? <p className="portal-muted">No recent changes.</p> : recent.map((c) => (
              <Link key={c.student_id} to={`/staff/students/${c.student_id}`} className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{c.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{c.changed_at ? new Date(c.changed_at).toLocaleDateString() : 'recently'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <RiskBadge level={c.from_risk} size="sm" />
                  <span style={{ color: 'var(--text-3)' }}>→</span>
                  <RiskBadge level={c.to_risk} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard
