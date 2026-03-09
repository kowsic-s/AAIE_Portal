import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminDashboard, listModelVersions, getSystemSettings, listDepartments } from '../../api/admin'
import { formatDate } from '../../utils/formatters'

/* ── helpers ── */
const useCountUp = (target, duration = 1400, trigger = true) => {
  const [val, setVal] = useState(0)
  const raf = useRef()
  useEffect(() => {
    if (!trigger || !target) return
    let start = 0
    const step = target / duration * 16
    const tick = () => { start = Math.min(start + step, target); setVal(Math.floor(start)); if (start < target) raf.current = requestAnimationFrame(tick) }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, trigger])
  return val
}
const riskColor = (l) => ({ High: 'var(--risk-high)', Medium: 'var(--risk-med)', Low: 'var(--risk-low)' })[l] || 'var(--text-3)'
const riskPillClass = (l) => {
  const m = {
    High: { bg: 'rgba(248,113,113,0.12)', c: 'var(--risk-high)', bc: 'rgba(248,113,113,0.25)' },
    Medium: { bg: 'rgba(251,191,36,0.12)', c: 'var(--risk-med)', bc: 'rgba(251,191,36,0.25)' },
    Low: { bg: 'rgba(52,211,153,0.12)', c: 'var(--risk-low)', bc: 'rgba(52,211,153,0.25)' },
  }
  return m[l] || m.Low
}

/* ── KPI card ── */
const KpiCard = ({ icon, iconBg, iconBorder, color, value, label, trend, trendType, delay = 0 }) => {
  const count = useCountUp(value)
  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden transition-all hover:-translate-y-0.5 group"
      style={{
        '--kpi-color': color,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, boxShadow: 'var(--shadow), var(--inset)',
        animationDelay: `${delay}s`,
      }}
    >
      <div className="absolute bottom-0 left-0 right-0 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" style={{ background: color }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg, border: `1px solid ${iconBorder}` }}>
          {icon}
        </div>
        {trend && (
          <span className="text-[0.72rem] font-bold px-2 py-1 rounded-full flex items-center gap-1"
            style={{ background: trendType === 'up' ? 'rgba(52,211,153,0.12)' : trendType === 'down' ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)',
              color: trendType === 'up' ? 'var(--risk-low)' : trendType === 'down' ? 'var(--risk-high)' : 'var(--risk-med)' }}>
            {trendType === 'up' ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div className="font-display text-[2rem] font-extrabold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
        {count.toLocaleString()}
      </div>
      <div className="text-[0.8rem] font-medium" style={{ color: 'var(--text-3)' }}>{label}</div>
    </div>
  )
}

/* ── Card shell ── */
const Card = ({ title, icon, action, children, className = '' }) => (
  <div className={`overflow-hidden ${className}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow), var(--inset)' }}>
    {title && (
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="font-display text-[0.9rem] font-bold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          {icon}{title}
        </span>
        {action}
      </div>
    )}
    {children}
  </div>
)

/* ── Donut chart ── */
const DonutChart = ({ data }) => {
  const total = (data.Low || 0) + (data.Medium || 0) + (data.High || 0)
  if (!total) return <div className="p-6 text-center text-sm" style={{ color: 'var(--text-3)' }}>No prediction data</div>
  const C = 2 * Math.PI * 60 // ~377
  const pctLow = (data.Low || 0) / total
  const pctMed = (data.Medium || 0) / total
  const pctHigh = (data.High || 0) / total
  const arcLow = pctLow * C
  const arcMed = pctMed * C
  const arcHigh = pctHigh * C
  const items = [
    { label: 'Low Risk', val: data.Low || 0, pct: Math.round(pctLow * 100), color: '#34d399' },
    { label: 'Medium Risk', val: data.Medium || 0, pct: Math.round(pctMed * 100), color: '#fbbf24' },
    { label: 'High Risk', val: data.High || 0, pct: Math.round(pctHigh * 100), color: '#f87171' },
  ]
  return (
    <div className="flex items-center gap-7 p-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="flex-shrink-0">
        <circle cx="80" cy="80" r="60" fill="none" stroke="var(--surface-3)" strokeWidth="24"/>
        <circle cx="80" cy="80" r="60" fill="none" stroke="#34d399" strokeWidth="24"
          strokeDasharray={`${arcLow} ${C}`} strokeDashoffset="0"
          style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.16,1,0.3,1)', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}/>
        <circle cx="80" cy="80" r="60" fill="none" stroke="#fbbf24" strokeWidth="24"
          strokeDasharray={`${arcMed} ${C}`} strokeDashoffset={`${-arcLow - 1}`}
          style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.16,1,0.3,1)', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}/>
        <circle cx="80" cy="80" r="60" fill="none" stroke="#f87171" strokeWidth="24"
          strokeDasharray={`${arcHigh} ${C}`} strokeDashoffset={`${-arcLow - arcMed - 2}`}
          style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.16,1,0.3,1)', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}/>
        <text x="80" y="76" textAnchor="middle" fontFamily="Syne" fontSize="22" fontWeight="800" fill="var(--text-1)">{total.toLocaleString()}</text>
        <text x="80" y="94" textAnchor="middle" fontFamily="DM Sans" fontSize="11" fill="var(--text-3)">students</text>
      </svg>
      <div className="flex-1 flex flex-col gap-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: it.color, boxShadow: `0 0 6px ${it.color}` }}/>
            <span className="text-[0.82rem] flex-1" style={{ color: 'var(--text-2)' }}>{it.label}</span>
            <span className="font-display text-[0.9rem] font-bold" style={{ color: 'var(--text-1)' }}>{it.val}</span>
            <span className="text-[0.72rem]" style={{ color: 'var(--text-3)' }}>{it.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Department bar chart ── */
const DeptBarChart = ({ depts = [], riskDist = {} }) => {
  const total = (riskDist.Low || 0) + (riskDist.Medium || 0) + (riskDist.High || 0)
  const pHigh = total ? (riskDist.High || 0) / total : 0.22
  const pMed = total ? (riskDist.Medium || 0) / total : 0.35
  const pLow = total ? (riskDist.Low || 0) / total : 0.43
  return (
    <div className="px-6 pb-6">
      <div className="flex gap-3.5 pb-3 mb-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
        {[{ l: 'High', c: '#f87171' }, { l: 'Med', c: '#fbbf24' }, { l: 'Low', c: '#34d399' }].map((x) => (
          <span key={x.l} className="flex items-center gap-1.5 text-[0.7rem]" style={{ color: 'var(--text-3)' }}>
            <span className="inline-block w-2 h-2 rounded-sm" style={{ background: x.c }}/>{x.l}
          </span>
        ))}
      </div>
      {depts.slice(0, 5).map((d) => (
        <div key={d.id || d.code} className="flex items-center gap-3 mb-3.5">
          <span className="text-[0.78rem] w-[70px] truncate" style={{ color: 'var(--text-2)' }}>{d.name}</span>
          <div className="flex-1 h-7 rounded-md overflow-hidden flex" style={{ background: 'var(--surface-2)' }}>
            <div className="h-full" style={{ width: `${pHigh * 100}%`, background: 'rgba(248,113,113,0.7)' }}/>
            <div className="h-full" style={{ width: `${pMed * 100}%`, background: 'rgba(251,191,36,0.7)' }}/>
            <div className="h-full" style={{ width: `${pLow * 100}%`, background: 'rgba(52,211,153,0.7)' }}/>
          </div>
          <span className="text-[0.75rem] w-7 text-right" style={{ color: 'var(--text-3)' }}>{d.student_count ?? '—'}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Activity feed ── */
const ActivityFeed = ({ logs = [] }) => {
  const iconMap = {
    CREATE: { bg: 'rgba(52,211,153,0.12)', bc: 'rgba(52,211,153,0.2)', sc: '#34d399', d: 'M20 6L9 17l-5-5' },
    UPDATE: { bg: 'rgba(79,142,247,0.12)', bc: 'rgba(79,142,247,0.2)', sc: '#4f8ef7', d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' },
    DELETE: { bg: 'rgba(248,113,113,0.12)', bc: 'rgba(248,113,113,0.2)', sc: '#f87171', d: 'M18 6L6 18M6 6l12 12' },
    LOGIN: { bg: 'rgba(124,106,247,0.12)', bc: 'rgba(124,106,247,0.2)', sc: '#7c6af7', d: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3' },
  }
  const fallback = iconMap.UPDATE
  return (
    <div className="flex flex-col">
      {logs.slice(0, 5).map((log, i) => {
        const ic = iconMap[log.action?.toUpperCase()] || fallback
        return (
          <div key={i} className="flex gap-3 px-6 py-3.5 transition-colors" style={{ borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: ic.bg, border: `1px solid ${ic.bc}` }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ic.sc} strokeWidth="2"><path d={ic.d}/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.8rem] leading-snug" style={{ color: 'var(--text-2)' }}>
                <strong style={{ color: 'var(--text-1)', fontWeight: 600 }}>{log.action}</strong> on {log.entity_type}
              </div>
              <div className="text-[0.7rem] mt-0.5" style={{ color: 'var(--text-3)' }}>{formatDate(log.created_at)}</div>
            </div>
          </div>
        )
      })}
      {logs.length === 0 && <div className="px-6 py-8 text-center text-sm" style={{ color: 'var(--text-3)' }}>No recent activity</div>}
    </div>
  )
}

/* ── Model versions mini ── */
const ModelVersionsMini = ({ versions = [] }) => {
  const navigate = useNavigate()
  return (
    <div className="p-6 flex flex-col gap-2">
      {versions.slice(0, 3).map((v) => (
        <div key={v.version_id} className="flex items-center gap-3 p-3 rounded-[10px] transition-colors"
          style={{
            background: 'var(--surface-2)', border: `1px solid ${v.is_active ? 'var(--accent)' : 'var(--border)'}`,
            boxShadow: v.is_active ? '0 0 12px var(--glow-a)' : 'none',
          }}>
          <span className="text-[0.65rem] font-bold px-2 py-[3px] rounded-full flex-shrink-0"
            style={v.model_type?.includes('Random') || v.model_type?.includes('random') ? { background: 'rgba(79,142,247,0.15)', color: 'var(--accent)' } : { background: 'rgba(124,106,247,0.15)', color: 'var(--accent-2)' }}>
            {v.model_type?.includes('Random') || v.model_type?.includes('random') ? 'RF' : 'DT'}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[0.8rem] font-semibold truncate" style={{ color: 'var(--text-1)' }}>{v.version_id}</div>
            <div className="text-[0.7rem]" style={{ color: 'var(--text-3)' }}>Trained {formatDate(v.trained_at)}</div>
          </div>
          <span className="font-display text-[0.9rem] font-bold" style={{ color: v.is_active ? 'var(--risk-low)' : 'var(--text-3)' }}>
            {(v.macro_recall * 100).toFixed(1)}%
          </span>
          {v.is_active && (
            <span className="text-[0.62rem] font-bold px-[7px] py-[2px] rounded-full flex-shrink-0"
              style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--risk-low)', border: '1px solid rgba(52,211,153,0.25)' }}>Active</span>
          )}
        </div>
      ))}
      <button className="btn-primary mt-1 justify-center text-[0.8rem]" onClick={() => navigate('/admin/model')}>Manage</button>
    </div>
  )
}

/* ── Settings mini ── */
const SettingsMini = ({ settings }) => {
  const navigate = useNavigate()
  if (!settings) return null
  const rows = [
    { label: 'High Risk Threshold', value: `≥ ${(settings.high_risk_threshold * 100).toFixed(0)}%` },
    { label: 'Placement GPA Floor', value: settings.placement_gpa_floor?.toFixed(1) },
    { label: 'Attendance Floor', value: `${settings.placement_attendance_floor}%` },
    { label: 'Attendance Weight', value: settings.attendance_weight?.toFixed(2), bar: settings.attendance_weight },
    { label: 'GPA Weight', value: settings.gpa_weight?.toFixed(2), bar: settings.gpa_weight },
  ]
  return (
    <div>
      {rows.map((r, i) => (
        <div key={r.label} className="flex items-center justify-between px-6 py-3.5" style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <span className="text-[0.82rem]" style={{ color: 'var(--text-2)' }}>{r.label}</span>
          {r.bar != null ? (
            <div className="flex items-center gap-2.5">
              <div className="w-20 h-[5px] rounded-sm overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                <div className="h-full rounded-sm" style={{ width: `${r.bar * 100}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}/>
              </div>
              <span className="font-display text-[0.9rem] font-bold" style={{ color: 'var(--text-1)' }}>{r.value}</span>
            </div>
          ) : (
            <span className="font-display text-[0.9rem] font-bold" style={{ color: 'var(--text-1)' }}>{r.value}</span>
          )}
        </div>
      ))}
      <div className="px-6 pb-4 pt-2">
        <button className="btn-secondary w-full justify-center text-[0.8rem]" onClick={() => navigate('/admin/settings')}>Edit</button>
      </div>
    </div>
  )
}

/* ── MAIN ── */
const AdminDashboard = () => {
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-dashboard'], queryFn: getAdminDashboard, staleTime: 2 * 60 * 1000 })
  const { data: modelData } = useQuery({ queryKey: ['admin-model-versions'], queryFn: listModelVersions, staleTime: 60 * 1000 })
  const { data: settingsData } = useQuery({ queryKey: ['admin-settings'], queryFn: getSystemSettings, staleTime: 60 * 1000 })
  const { data: deptData } = useQuery({ queryKey: ['admin-departments'], queryFn: listDepartments, staleTime: 60 * 1000 })

  if (isLoading) return <DashboardSkeleton />
  if (isError) return <div className="p-6 rounded-xl" style={{ color: 'var(--risk-high)', background: 'rgba(248,113,113,0.08)' }}>Failed to load dashboard data.</div>

  const d = data?.data ?? {}
  const kpis = d.kpis ?? {}
  const riskDist = d.risk_distribution ?? {}
  const topRisk = d.top_risk_students ?? []
  const auditLogs = d.recent_audit_logs ?? []
  const versions = Array.isArray(modelData?.data) ? modelData.data : (modelData?.data?.versions ?? [])
  const settings = settingsData?.data
  const depts = Array.isArray(deptData?.data) ? deptData.data : (deptData?.data?.departments ?? [])

  return (
    <div className="space-y-7">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="2" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
          iconBg="rgba(79,142,247,0.12)" iconBorder="rgba(79,142,247,0.2)" color="#4f8ef7"
          value={kpis.total_students ?? 0} label="Total Students" trend="+12" trendType="up" delay={0.05} />
        <KpiCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          iconBg="rgba(248,113,113,0.12)" iconBorder="rgba(248,113,113,0.2)" color="#f87171"
          value={kpis.high_risk_count ?? 0} label="At-Risk Students" trend={`+${kpis.high_risk_count ? Math.min(8, kpis.high_risk_count) : 0}`} trendType="down" delay={0.1} />
        <KpiCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" width="18" height="18"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          iconBg="rgba(251,191,36,0.12)" iconBorder="rgba(251,191,36,0.2)" color="#fbbf24"
          value={kpis.total_staff ?? 0} label="Total Staff" trend={`${kpis.total_staff ?? 0} active`} trendType="warn" delay={0.15} />
        <KpiCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" width="18" height="18"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
          iconBg="rgba(52,211,153,0.12)" iconBorder="rgba(52,211,153,0.2)" color="#34d399"
          value={depts.length || 0} label="Departments" trend={`${depts.length} active`} trendType="up" delay={0.2} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        <Card title="Risk Distribution" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>}>
          <DonutChart data={riskDist} />
        </Card>
        <Card title="By Department" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>}>
          <DeptBarChart depts={depts} riskDist={riskDist} />
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        <Card title="High Risk Students" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Student', 'Dept', 'GPA', 'Attend.', 'Risk', 'Confidence'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[0.68rem] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topRisk.slice(0, 5).map((s, i) => {
                  const rp = riskPillClass(s.risk_level)
                  const initials = (s.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  const conf = s.confidence != null ? Math.round(s.confidence * 100) : null
                  return (
                    <tr key={i} className="transition-colors" style={{ cursor: 'default' }}>
                      <td className="px-4 py-3 text-[0.82rem]" style={{ color: 'var(--text-2)', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[0.7rem] font-display font-bold text-white flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${riskColor(s.risk_level)}, var(--accent-2))` }}>
                            {initials}
                          </div>
                          <div>
                            <div className="text-[0.82rem] font-semibold" style={{ color: 'var(--text-1)' }}>{s.name}</div>
                            <div className="text-[0.68rem]" style={{ color: 'var(--text-3)' }}>{s.student_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[0.82rem]" style={{ color: 'var(--text-2)', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>{s.department}</td>
                      <td className="px-4 py-3 text-[0.82rem]" style={{ color: 'var(--text-2)', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>{s.gpa}</td>
                      <td className="px-4 py-3 text-[0.82rem]" style={{ color: 'var(--text-2)', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>{s.attendance_pct}%</td>
                      <td className="px-4 py-3" style={{ borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                        <span className="text-[0.67rem] font-bold px-2 py-[3px] rounded-full inline-flex items-center gap-1 whitespace-nowrap"
                          style={{ background: rp.bg, color: rp.c, border: `1px solid ${rp.bc}` }}>
                          <span className="w-[5px] h-[5px] rounded-full" style={{ background: rp.c }}/>{s.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                        {conf != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-[60px] h-1 rounded-sm overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                              <div className="h-full rounded-sm" style={{ width: `${conf}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}/>
                            </div>
                            <span className="text-[0.75rem]" style={{ color: 'var(--text-3)' }}>{conf}%</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Recent Activity" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}>
          <ActivityFeed logs={auditLogs} />
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Model Versions" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}>
          <ModelVersionsMini versions={versions} />
        </Card>
        <Card title="System Settings" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>}>
          <SettingsMini settings={settings} />
        </Card>
      </div>
    </div>
  )
}

const DashboardSkeleton = () => (
  <div className="space-y-7 animate-pulse">
    <div className="grid grid-cols-4 gap-5">{[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl" style={{ background: 'var(--surface)' }}/>)}</div>
    <div className="grid grid-cols-[1.6fr_1fr] gap-5"><div className="h-56 rounded-2xl" style={{ background: 'var(--surface)' }}/><div className="h-56 rounded-2xl" style={{ background: 'var(--surface)' }}/></div>
  </div>
)

export default AdminDashboard
