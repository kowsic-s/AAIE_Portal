import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStudents } from '../../hooks/useStudents'
import RiskBadge from '../../components/RiskBadge'

const FILTERS = ['', 'Low', 'Medium', 'High']

const StaffStudents = () => {
  const [riskFilter, setRiskFilter] = useState('')
  const [search, setSearch] = useState('')
  const { students, isLoading } = useStudents({ risk_level: riskFilter || undefined })

  const filtered = useMemo(() => {
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter((s) => (s.name || '').toLowerCase().includes(q) || (s.student_code || '').toLowerCase().includes(q))
  }, [students, search])

  return (
    <div className="staff-page">
      <div className="staff-filter-row">
        {FILTERS.map((f) => (
          <button key={f || 'all'} className={`staff-filter-pill ${riskFilter === f ? 'active' : ''}`} onClick={() => setRiskFilter(f)}>
            {f || 'All'}
          </button>
        ))}
      </div>

      <div className="staff-shell">
        <div className="staff-shell-accent" />
        <div className="staff-shell-head">
          <div className="relative min-w-[220px] flex-1 max-w-[320px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="input-field pl-9" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="text-sm" style={{ color: 'var(--text-3)' }}>{filtered.length} results</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Code', 'Name', 'GPA', 'Attend %', 'Risk', 'Open Intv', 'Last Intervention', 'Placement', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[0.68rem] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-6" style={{ color: 'var(--text-3)' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-6" style={{ color: 'var(--text-3)' }}>No students found.</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>{s.student_code}</td>
                  <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[0.68rem] font-bold text-white" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))' }}>
                        {(s.name || '?').split(' ').map((w) => w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <span className="text-[0.84rem] font-semibold" style={{ color: 'var(--text-1)' }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{s.gpa != null ? Number(s.gpa).toFixed(2) : '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{s.attendance_pct != null ? `${Number(s.attendance_pct).toFixed(1)}%` : '—'}</td>
                  <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}><RiskBadge level={s.risk_level} size="sm" /></td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{s.open_interventions ?? 0}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
                    {s.latest_intervention_status ? `${String(s.latest_intervention_type || '').replace(/_/g, ' ')} (${String(s.latest_intervention_status).replace(/_/g, ' ')})` : '—'}
                  </td>
                  <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className={`badge ${s.placement_eligible ? 'badge-green' : 'badge-red'}`}>{s.placement_eligible ? 'Eligible' : 'Not Eligible'}</span>
                  </td>
                  <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <Link to={`/staff/students/${s.id}`} className="text-[0.78rem] font-semibold px-2 py-1 rounded-md" style={{ color: 'var(--accent)', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default StaffStudents
