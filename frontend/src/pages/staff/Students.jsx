import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStudents } from '../../hooks/useStudents'
import DataTable from '../../components/DataTable'
import RiskBadge from '../../components/RiskBadge'

const RISK_OPTIONS = ['', 'Low', 'Medium', 'High']

const COLUMNS = [
  { key: 'student_code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'gpa', label: 'GPA', render: (v) => (v != null ? Number(v).toFixed(2) : '—') },
  { key: 'attendance_pct', label: 'Attend %', render: (v) => (v != null ? `${Number(v).toFixed(1)}%` : '—') },
  { key: 'risk_level', label: 'Risk', render: (v) => <RiskBadge level={v} /> },
  { key: 'placement_eligible', label: 'Placement', render: (v) => (
    <span className={`badge ${v ? 'badge-green' : 'badge-red'}`}>{v ? 'Eligible' : 'Not Eligible'}</span>
  )},
]

const StaffStudents = () => {
  const [riskFilter, setRiskFilter] = useState('')
  const { students, isLoading } = useStudents({ risk_level: riskFilter || undefined })

  const columnsWithAction = [
    ...COLUMNS,
    {
      key: '_view',
      label: '',
      render: (_, row) => (
        <Link className="btn-sm btn-ghost text-[#3b82f6]" to={`/staff/students/${row.id}`}>
          View
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">Students</h1>
        <p className="text-[#94a3b8] mt-1">Your department's students</p>
      </div>

      {/* Risk filter pills */}
      <div className="flex gap-2">
        {RISK_OPTIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRiskFilter(r)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              riskFilter === r
                ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
                : 'text-[#94a3b8] border-white/10 hover:border-[#3b82f6]/40 bg-white/[0.05]'
            }`}
          >
            {r || 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        <DataTable columns={columnsWithAction} data={students} loading={isLoading} />
      </div>
    </div>
  )
}

export default StaffStudents
