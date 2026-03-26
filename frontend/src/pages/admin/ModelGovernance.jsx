import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { listModelVersions, promoteModel, trainModel } from '../../api/admin.js'
import { formatDate } from '../../utils/formatters.js'
import { toast } from '../../store/toastStore.js'

const typeBadge = (type) => {
  const isRF = type?.toLowerCase().includes('random')
  return (
    <span className="text-[0.65rem] font-bold px-2 py-[3px] rounded-full"
      style={isRF ? { background: 'rgba(79,142,247,0.15)', color: 'var(--accent)' } : { background: 'rgba(124,106,247,0.15)', color: 'var(--accent-2)' }}>
      {isRF ? 'Random Forest' : 'Decision Tree'}
    </span>
  )
}

const AdminModelGovernance = () => {
  const qc = useQueryClient()
  const [trainMsg, setTrainMsg] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-model-versions'],
    queryFn: listModelVersions,
    staleTime: 30 * 1000,
  })

  const versions = Array.isArray(data?.data) ? data.data : (data?.data?.versions ?? [])
  const sorted = [...versions].sort((a, b) => new Date(b.trained_at) - new Date(a.trained_at))

  const promoteMut = useMutation({
    mutationFn: promoteModel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-model-versions'] }); toast.success('Model promoted') },
  })

  const trainMut = useMutation({
    mutationFn: trainModel,
    onSuccess: (res) => {
      setTrainMsg(res?.data?.message ?? 'Training started.')
      qc.invalidateQueries({ queryKey: ['admin-model-versions'] })
      toast.success('Training initiated')
      setTimeout(() => setTrainMsg(''), 6000)
    },
  })

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[0.82rem]" style={{ color: 'var(--text-2)' }}>{versions.length} models</span>
        </div>
        <button className="btn-primary" disabled={trainMut.isPending}
          onClick={() => { if (window.confirm('Start a new training run?')) trainMut.mutate() }}>
          {trainMut.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Training...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Train New Model
            </span>
          )}
        </button>
      </div>

      {trainMsg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-xl px-5 py-3 text-[0.82rem]"
          style={{ background: 'rgba(79,142,247,0.08)', color: 'var(--accent)', border: '1px solid rgba(79,142,247,0.2)' }}>
          {trainMsg}
        </motion.div>
      )}

      {/* Table */}
      <div className="overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow), var(--inset)' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Version ID', 'Type', 'Accuracy', 'Macro Recall', 'Trained', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[0.68rem] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-5 rounded animate-pulse" style={{ background: 'var(--surface-2)', width: `${60 + i * 10}%` }} /></td></tr>
                ))
              ) : sorted.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-3)' }}>No models trained yet.</td></tr>
              ) : (
                sorted.map((v) => (
                  <tr key={v.version_id} className="transition-colors hover:bg-[var(--surface-2)]"
                    style={{ background: v.is_active ? 'rgba(52,211,153,0.04)' : undefined }}>
                    <td className="px-5 py-3.5 font-mono text-[0.82rem] font-medium" style={{ color: 'var(--text-1)', borderBottom: '1px solid var(--border)' }}>{v.version_id}</td>
                    <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>{typeBadge(v.model_type)}</td>
                    <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="font-display text-[0.88rem] font-bold" style={{ color: 'var(--text-1)' }}>{(v.accuracy * 100).toFixed(1)}%</span>
                    </td>
                    <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1 rounded-sm overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                          <div className="h-full rounded-sm" style={{ width: `${v.macro_recall * 100}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
                        </div>
                        <span className="font-display text-[0.82rem] font-bold" style={{ color: 'var(--text-1)' }}>{(v.macro_recall * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[0.82rem]" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>{formatDate(v.trained_at)}</td>
                    <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      {v.is_active ? (
                        <span className="text-[0.62rem] font-bold px-[7px] py-[3px] rounded-full"
                          style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--risk-low)', border: '1px solid rgba(52,211,153,0.25)' }}>Active</span>
                      ) : (
                        <span className="text-[0.68rem]" style={{ color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      {!v.is_active && (
                        <button className="text-[0.78rem] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                          disabled={promoteMut.isPending}
                          onClick={() => { if (window.confirm(`Promote ${v.version_id}?`)) promoteMut.mutate(v.version_id) }}>
                          {promoteMut.isPending ? '...' : 'Promote'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature importances (active model) */}
      {(() => {
        const active = versions.find(v => v.is_active)
        if (!active?.feature_importances) return null
        return (
          <div className="overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow), var(--inset)' }}>
            <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="font-display text-[0.9rem] font-bold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Feature Importances — {active.version_id}
              </span>
            </div>
            <div className="p-6 space-y-2.5">
              {Object.entries(active.feature_importances).sort((a, b) => b[1] - a[1]).map(([feat, imp]) => (
                <div key={feat} className="flex items-center gap-3">
                  <span className="text-[0.82rem] w-36 truncate capitalize" style={{ color: 'var(--text-2)' }}>{feat.replace(/_/g, ' ')}</span>
                  <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                    <div className="h-full rounded-sm transition-all" style={{ width: `${(imp * 100).toFixed(1)}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
                  </div>
                  <span className="text-[0.78rem] font-display font-bold w-12 text-right" style={{ color: 'var(--text-1)' }}>{(imp * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default AdminModelGovernance
