import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useInterventions, useUpdateIntervention } from '../../hooks/useIntervention'
import DataTable from '../../components/DataTable'
import { formatDate } from '../../utils/formatters'
import { AnimatePresence, motion } from 'framer-motion'

const STATUS_OPTIONS = ['Scheduled', 'In Progress', 'Completed', 'Cancelled']
const FILTER_OPTIONS = ['', ...STATUS_OPTIONS]

const COLUMNS = [
  { key: 'student_name', label: 'Student' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  {
    key: 'status',
    label: 'Status',
    render: (v) => (
      <span className={`badge text-xs ${
        v === 'Completed' ? 'badge-green' :
        v === 'Cancelled' ? 'badge-red' :
        v === 'In Progress' ? 'badge-blue' : 'badge-gray'
      }`}>{v}</span>
    ),
  },
  { key: 'scheduled_date', label: 'Scheduled', render: (v) => formatDate(v) },
]

const StaffInterventions = () => {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [editingInt, setEditingInt] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')

  const { interventions, isLoading } = useInterventions({ status: statusFilter || undefined })
  const updateMut = useUpdateIntervention()

  const handleUpdate = () => {
    if (!editingInt) return
    updateMut.mutate(
      { interventionId: editingInt.id, payload: { status: newStatus, notes } },
      { onSuccess: () => { setEditingInt(null); qc.invalidateQueries({ queryKey: ['interventions'] }) } }
    )
  }

  const rowActions = (row) => (
    <button
      className="btn-sm btn-ghost text-[#3b82f6]"
      onClick={() => { setEditingInt(row); setNewStatus(row.status); setNotes(row.notes ?? '') }}
    >
      Update Status
    </button>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">Interventions</h1>
        <p className="text-[#94a3b8] mt-1">Track and manage interventions</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === s ? 'bg-[#3b82f6] text-white border-[#3b82f6]' : 'text-[#94a3b8] border-white/10 hover:border-[#3b82f6]/40 bg-white/[0.05]'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        <DataTable
          columns={[...COLUMNS, { key: '_actions', label: '', render: (_, row) => rowActions(row) }]}
          data={interventions}
          loading={isLoading}
        />
      </div>

      <AnimatePresence>
        {editingInt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl w-full max-w-md p-6 border border-white/10"
              style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#f0f4ff]">Update Intervention</h2>
                <button onClick={() => setEditingInt(null)} className="text-[#475569] hover:text-[#f0f4ff] text-xl transition-colors">×</button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#94a3b8] mb-1"><span className="font-medium">Student:</span> {editingInt.student_name}</p>
                  <p className="text-sm text-[#94a3b8]"><span className="font-medium">Type:</span> {editingInt.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-1">Status</label>
                  <select
                    className="input-field"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-1">Notes</label>
                  <textarea
                    className="input-field min-h-[80px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    className="btn-primary flex-1"
                    onClick={handleUpdate}
                    disabled={updateMut.isPending}
                  >
                    {updateMut.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button className="btn-secondary flex-1" onClick={() => setEditingInt(null)}>Cancel</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StaffInterventions
