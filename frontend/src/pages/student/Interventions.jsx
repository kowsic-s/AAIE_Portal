import { useQuery } from '@tanstack/react-query'
import { getOwnInterventions } from '../../api/student.js'
import DataTable from '../../components/DataTable.jsx'
import { formatDate } from '../../utils/formatters.js'

const toLabel = (value) => {
  if (!value) return '—'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const statusBadgeClass = (status) => {
  if (status === 'closed') return 'badge-green'
  if (status === 'in_progress') return 'badge-blue'
  if (status === 'open') return 'badge-amber'
  return 'badge-gray'
}

const COLUMNS = [
  { key: 'type', label: 'Type', render: (v) => toLabel(v) },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status', render: (v) => <span className={`badge text-xs ${statusBadgeClass(v)}`}>{toLabel(v)}</span> },
  { key: 'created_at', label: 'Created', render: (v) => formatDate(v) },
  { key: 'closed_at', label: 'Closed', render: (v) => (v ? formatDate(v) : '—') },
]

const StudentInterventions = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-interventions'],
    queryFn: getOwnInterventions,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
  })

  const interventions = data?.data?.interventions ?? []
  const openCount = interventions.filter((i) => i.status === 'open' || i.status === 'in_progress').length

  if (isError) return <div className="p-6" style={{ color: 'var(--risk-high)' }}>Failed to load interventions.</div>

  return (
    <div className="student-page">
      <div className="flex justify-end"><button className="btn-secondary" onClick={() => refetch()}>Refresh</button></div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="student-kpi"><div className="student-kpi-value">{interventions.length}</div><div className="student-kpi-label">Total</div></div>
        <div className="student-kpi"><div className="student-kpi-value">{openCount}</div><div className="student-kpi-label">Open / In Progress</div></div>
        <div className="student-kpi"><div className="student-kpi-value">{interventions.length - openCount}</div><div className="student-kpi-label">Closed</div></div>
      </div>

      <div className="student-shell">
        <div className="student-shell-accent" />
        <div className="student-shell-head"><div className="student-shell-title">Intervention Records</div></div>
        <div className="p-4">
          {interventions.length === 0 && !isLoading ? <p style={{ color: 'var(--text-2)' }}>No intervention records yet.</p> : <DataTable columns={COLUMNS} data={interventions} loading={isLoading} pageSize={8} />}
        </div>
      </div>
    </div>
  )
}

export default StudentInterventions
