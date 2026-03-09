import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { listModelVersions, promoteModel, trainModel } from '../../api/admin'
import { formatDate } from '../../utils/formatters'
import { toast } from '../../store/toastStore'

const AdminModelGovernance = () => {
  const qc = useQueryClient()
  const [trainMsg, setTrainMsg] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-model-versions'],
    queryFn: listModelVersions,
    staleTime: 30 * 1000,
  })

  const versions = Array.isArray(data?.data) ? data.data : (data?.data?.versions ?? [])

  const promoteMut = useMutation({
    mutationFn: promoteModel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-model-versions'] })
      toast.success('Model promoted to active')
    },
  })

  const trainMut = useMutation({
    mutationFn: trainModel,
    onSuccess: (res) => {
      setTrainMsg(res?.data?.message ?? 'Training started in background.')
      qc.invalidateQueries({ queryKey: ['admin-model-versions'] })
      toast.success('Training initiated')
      setTimeout(() => setTrainMsg(''), 6000)
    },
  })

  const activeVersion = versions.find((v) => v.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f4ff]">Model Governance</h1>
          <p className="text-[#94a3b8] mt-1">Manage ML model versions</p>
        </div>
        <button
          className="btn-primary"
          disabled={trainMut.isPending}
          onClick={() => {
            if (window.confirm('Start a new training run? This runs in the background.')) trainMut.mutate()
          }}
        >
          {trainMut.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Training...
            </span>
          ) : '⚙ Train New Model'}
        </button>
      </div>

      {trainMsg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl px-4 py-3 text-sm text-[#3b82f6] border border-[rgba(59,130,246,0.3)]"
          style={{ background: 'rgba(59,130,246,0.1)' }}
        >
          {trainMsg}
        </motion.div>
      )}

      {/* Active Model Card */}
      {activeVersion && (
        <div className="card border border-[rgba(16,185,129,0.3)]" style={{ background: 'rgba(16,185,129,0.06)' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-green">Active</span>
                <span className="font-mono text-sm text-[#94a3b8]">{activeVersion.version_id}</span>
              </div>
              <p className="text-lg font-semibold text-[#f0f4ff]">{activeVersion.model_type}</p>
            </div>
            <div className="text-right text-sm text-[#94a3b8]">
              <p>Macro Recall: <span className="font-semibold text-[#10b981]">{(activeVersion.macro_recall * 100).toFixed(1)}%</span></p>
              <p>Accuracy: <span className="font-semibold text-[#f0f4ff]">{(activeVersion.accuracy * 100).toFixed(1)}%</span></p>
              <p>Trained: {formatDate(activeVersion.trained_at)}</p>
            </div>
          </div>
          {activeVersion.feature_importances && (
            <div className="mt-4">
              <p className="text-xs font-medium text-[#94a3b8] mb-2">Feature Importances</p>
              <div className="space-y-1">
                {Object.entries(activeVersion.feature_importances).sort((a, b) => b[1] - a[1]).map(([feat, imp]) => (
                  <div key={feat} className="flex items-center gap-2">
                    <span className="text-xs text-[#94a3b8] w-36 truncate">{feat.replace(/_/g, ' ')}</span>
                    <div className="flex-1 bg-white/[0.08] rounded-full h-2">
                      <div
                        className="bg-[#10b981] h-2 rounded-full transition-all"
                        style={{ width: `${(imp * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-[#94a3b8] w-10 text-right">{(imp * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Version History */}
      <div className="card">
        <h2 className="font-semibold text-[#f0f4ff] mb-4">Version History</h2>
        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1,2,3].map(i=><div key={i} className="h-16 bg-white/[0.08] rounded" />)}</div>
        ) : versions.length === 0 ? (
          <p className="text-[#94a3b8] text-sm">No models trained yet.</p>
        ) : (
          <div className="space-y-3">
            {[...versions].sort((a, b) => new Date(b.trained_at) - new Date(a.trained_at)).map((v) => (
              <div
                key={v.version_id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  v.is_active ? 'border-[rgba(16,185,129,0.3)]' : 'border-white/10'
                }`}
                style={{ background: v.is_active ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)' }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    {v.is_active && <span className="badge badge-green text-xs">Active</span>}
                    <span className="font-mono text-sm text-[#94a3b8]">{v.version_id}</span>
                  </div>
                  <div className="text-xs text-[#475569] mt-0.5">
                    {v.model_type} · Recall {(v.macro_recall * 100).toFixed(1)}% · Trained {formatDate(v.trained_at)}
                  </div>
                </div>
                {!v.is_active && (
                  <button
                    className="btn-secondary text-sm"
                    disabled={promoteMut.isPending}
                    onClick={() => {
                      if (window.confirm(`Promote ${v.version_id} to active?`)) promoteMut.mutate(v.version_id)
                    }}
                  >
                    {promoteMut.isPending ? 'Promoting...' : 'Promote'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminModelGovernance
