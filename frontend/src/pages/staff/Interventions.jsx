import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useInterventions, useUpdateIntervention } from '../../hooks/useIntervention'
import { formatDate } from '../../utils/formatters'

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
]

const badgeClass = (status) => {
  if (status === 'closed') return 'badge-green'
  if (status === 'in_progress') return 'badge-blue'
  return 'badge-amber'
}

const toLabel = (status) => status === 'in_progress' ? 'In Progress' : status === 'closed' ? 'Closed' : 'Open'

const StaffInterventions = () => {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [nextStatus, setNextStatus] = useState('open')

  const { interventions, isLoading } = useInterventions({ status: statusFilter || undefined })
  const updateMut = useUpdateIntervention()

  const filtered = useMemo(() => {
    if (!search.trim()) return interventions
    const q = search.toLowerCase()
    return interventions.filter((i) => (i.student_name || '').toLowerCase().includes(q) || (i.type || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q))
  }, [interventions, search])

  const onSave = () => {
    if (!editing) return
    updateMut.mutate(
      { interventionId: editing.id, payload: { status: nextStatus } },
      {
        onSuccess: () => {
          setEditing(null)
          qc.invalidateQueries({ queryKey: ['interventions'] })
          qc.invalidateQueries({ queryKey: ['staff-dashboard'] })
          qc.invalidateQueries({ queryKey: ['students'] })
        },
      }
    )
  }

  return (
    <div className="staff-page">
      <div className="staff-filter-row">
        {FILTERS.map((f) => (
          <button key={f.label} className={`staff-filter-pill ${statusFilter === f.value ? 'active' : ''}`} onClick={() => setStatusFilter(f.value)}>{f.label}</button>
        ))}
      </div>

      <div className="staff-shell">
        <div className="staff-shell-accent" />
        <div className="staff-shell-head">
          <div className="relative min-w-[220px] flex-1 max-w-[320px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="input-field pl-9" placeholder="Search interventions..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="text-sm" style={{ color: 'var(--text-3)' }}>{filtered.length} results</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Student', 'Type', 'Description', 'Status', 'Created', 'Closed', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[0.68rem] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-6" style={{ color: 'var(--text-3)' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6" style={{ color: 'var(--text-3)' }}>No interventions found.</td></tr>
              ) : filtered.map((i) => (
                <tr key={i.id} className="transition-colors hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3" style={{ color: 'var(--text-1)', borderBottom: '1px solid var(--border)' }}>{i.student_name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{String(i.type || '').replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{i.description}</td>
                  <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className={`badge ${badgeClass(i.status)}`}>{toLabel(i.status)}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>{formatDate(i.created_at)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>{i.closed_at ? formatDate(i.closed_at) : '—'}</td>
                  <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <button className="btn-secondary text-xs" onClick={() => { setEditing(i); setNextStatus(i.status || 'open') }}>Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'color-mix(in srgb, var(--bg) 72%, #000 28%)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', boxShadow: 'var(--shadow), var(--inset)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="staff-shell-title">Update Intervention</h3>
                <button onClick={() => setEditing(null)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
              </div>
              <p className="text-sm mb-2" style={{ color: 'var(--text-2)' }}>{editing.student_name}</p>
              <select className="input-field mb-4" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
              <div className="flex gap-2">
                <button className="btn-primary flex-1" onClick={onSave} disabled={updateMut.isPending}>{updateMut.isPending ? 'Saving...' : 'Save'}</button>
                <button className="btn-secondary flex-1" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StaffInterventions
