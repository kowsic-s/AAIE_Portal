import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getStudentDashboard } from '../../api/student.js'
import RiskBadge from '../../components/RiskBadge.jsx'

const QuickIcon = ({ kind }) => {
  if (kind === 'performance') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  if (kind === 'interventions') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2"/><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>
  if (kind === 'whatif') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3"/></svg>
}

const StudentDashboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: getStudentDashboard,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  if (isLoading) return <div className="student-page"><div className="student-kpi-grid">{[1,2,3,4].map((i) => <div key={i} className="student-kpi h-28" />)}</div></div>
  if (isError) return <div className="p-6" style={{ color: 'var(--risk-high)' }}>Failed to load dashboard.</div>

  const d = data?.data ?? {}
  const pred = d.latest_prediction ?? d.prediction ?? {}
  const perf = d.latest_performance ?? {}

  return (
    <div className="student-page">
      <div className="student-shell">
        <div className="student-shell-accent" />
        <div className="p-5 flex items-start justify-between gap-4" style={{ background: 'color-mix(in srgb, var(--accent) 7%, var(--surface))' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Current Risk Level</p>
            <div className="mt-2"><RiskBadge level={pred.risk_level || 'Medium'} size="lg" /></div>
            <p className="text-sm mt-3" style={{ color: 'var(--text-2)' }}>{pred.risk_message || 'Use recommendations and interventions to improve your trajectory.'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Confidence</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{pred.confidence != null ? `${(pred.confidence * 100).toFixed(0)}%` : '—'}</p>
          </div>
        </div>
      </div>

      <div className="student-kpi-grid">
        <div className="student-kpi">
          <div className="student-kpi-top"><div className="student-kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div></div>
          <div className="student-kpi-value">{perf.gpa != null ? Number(perf.gpa).toFixed(2) : '0.00'}</div>
          <div className="student-kpi-label">GPA</div>
        </div>
        <div className="student-kpi">
          <div className="student-kpi-top"><div className="student-kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></div></div>
          <div className="student-kpi-value">{perf.attendance_pct != null ? `${Number(perf.attendance_pct).toFixed(1)}%` : '0.0%'}</div>
          <div className="student-kpi-label">Attendance</div>
        </div>
        <div className="student-kpi">
          <div className="student-kpi-top"><div className="student-kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div></div>
          <div className="student-kpi-value">{perf.reward_points ?? 0}</div>
          <div className="student-kpi-label">Reward Points</div>
        </div>
        <div className="student-kpi">
          <div className="student-kpi-top"><div className="student-kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div></div>
          <div className="student-kpi-value">{perf.activity_points ?? 0}</div>
          <div className="student-kpi-label">Activity Points</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { to: '/student/performance', label: 'View Performance History', kind: 'performance' },
          { to: '/student/interventions', label: 'My Interventions', kind: 'interventions' },
          { to: '/student/what-if', label: 'What-If Simulator', kind: 'whatif' },
          { to: '/student/recommendations', label: 'AI Recommendations', kind: 'recommendations' },
        ].map((x) => (
          <Link key={x.to} to={x.to} className="student-shell p-4 flex items-center gap-3 hover:opacity-95" style={{ textDecoration: 'none' }}>
            <div className="student-kpi-icon"><QuickIcon kind={x.kind} /></div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{x.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default StudentDashboard
