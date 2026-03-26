import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { getStudentDetail, createIntervention, getRecommendations, generateRecommendation } from '../../api/staff.js'
import { useStudentDetail } from '../../hooks/useStudents.js'
import { toast } from '../../store/toastStore.js'
import KpiCard from '../../components/KpiCard.jsx'
import RiskBadge from '../../components/RiskBadge.jsx'
import GpaTrendChart from '../../components/charts/GpaTrendChart.jsx'
import AttendanceChart from '../../components/charts/AttendanceChart.jsx'
import { formatDate } from '../../utils/formatters.js'

const TYPE_OPTIONS = [
  { label: 'Academic Support', value: 'academic_support' },
  { label: 'Counselling', value: 'counselling' },
  { label: 'Warning Letter', value: 'warning_letter' },
  { label: 'Parent Meeting', value: 'parent_meeting' },
  { label: 'Peer Mentoring', value: 'peer_mentoring' },
]

const StudentDetail = () => {
  const { id } = useParams()
  const qc = useQueryClient()
  const [showIntModal, setShowIntModal] = useState(false)
  const [intForm, setIntForm] = useState({ type: 'academic_support', description: '' })
  const [genLoading, setGenLoading] = useState(false)

  const { student, isLoading, isError, refetch } = useStudentDetail(id)

  const recQuery = useQuery({
    queryKey: ['staff-recommendations', id],
    queryFn: () => getRecommendations(id),
    staleTime: 30 * 1000,
  })

  const createIntMut = useMutation({
    mutationFn: (payload) => createIntervention(id, payload),
    onSuccess: () => {
      refetch()
      setShowIntModal(false)
      setIntForm({ type: 'academic_support', description: '' })
      toast.success('Intervention added')
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to add intervention')
    },
  })

  const handleGenerateRec = async () => {
    setGenLoading(true)
    try {
      await generateRecommendation(id)
      qc.invalidateQueries({ queryKey: ['staff-recommendations', id] })
      toast.success('Recommendation generated')
    } catch {
      toast.error('Failed to generate recommendation')
    } finally {
      setGenLoading(false)
    }
  }

  if (isLoading) return <Skeleton />
  if (isError || !student) return <div className="text-[#ef4444] p-6">Student not found.</div>

  const pred = student.latest_prediction ?? {}
  const perf = student.latest_performance ?? {}
  const interventions = student.interventions ?? []
  const perfHistory = student.performance_history ?? []
  const recommendations = recQuery.data?.data?.recommendations ?? []

  return (
    <div className="portal-page">
      {/* Header */}
      <div className="portal-header">
        <div className="flex items-center gap-4">
          <Link to="/staff/students" className="transition-colors" style={{ color: 'var(--text-3)' }}>←</Link>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            {student.name?.charAt(0) ?? '?'}
          </div>
          <div>
            <h1 className="portal-title">{student.name}</h1>
            <p className="portal-subtitle">{student.student_code} · {student.department_name}</p>
          </div>
        </div>
        <RiskBadge level={pred.risk_level} size="lg" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="GPA" value={perf.gpa ?? 0} icon="📊" color="blue" decimals={2} />
        <KpiCard label="Attendance" value={perf.attendance_pct ?? 0} icon="📅" color="green" decimals={1} suffix="%" />
        <KpiCard label="Reward Pts" value={perf.reward_points ?? 0} icon="🏆" color="amber" />
        <KpiCard label="Confidence" value={pred.confidence != null ? (pred.confidence * 100) : 0} icon="🎯" color="purple" decimals={1} suffix="%" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="portal-section-title mb-4">GPA Trend</h2>
          <GpaTrendChart data={perfHistory} />
        </div>
        <div className="card">
          <h2 className="portal-section-title mb-4">Attendance Trend</h2>
          <AttendanceChart data={perfHistory} />
        </div>
      </div>

      {/* AI Explanation */}
      {pred.explanation && (
        <div className="card border border-[rgba(59,130,246,0.3)]" style={{ background: 'rgba(59,130,246,0.06)' }}>
          <h2 className="portal-section-title mb-2" style={{ color: 'var(--accent)' }}>AI Risk Explanation</h2>
          <p className="portal-muted">{pred.explanation}</p>
          {pred.top_factors && (
            <div className="mt-3 flex flex-wrap gap-2">
              {pred.top_factors.map((f) => (
                <span key={f.feature} className="text-xs px-2 py-1 rounded-full text-[#3b82f6] border border-[rgba(59,130,246,0.3)]" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  {f.feature.replace(/_/g, ' ')}: {(f.importance * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interventions */}
      <div className="card">
        <div className="portal-panel-head">
          <h2 className="portal-section-title">Interventions</h2>
          <button className="btn-primary text-sm" onClick={() => setShowIntModal(true)}>+ Add</button>
        </div>
        {interventions.length === 0 ? (
          <p className="portal-muted" style={{ color: 'var(--text-3)' }}>No interventions recorded.</p>
        ) : (
          <div className="space-y-3">
            {interventions.map((iv) => (
              <div key={iv.id} className="flex items-start justify-between p-3 rounded-xl border border-white/[0.06]" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{iv.type}</span>
                    <span className={`badge text-xs ${
                      iv.status === 'Completed' ? 'badge-green' :
                      iv.status === 'Cancelled' ? 'badge-red' : 'badge-blue'
                    }`}>{iv.status}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{iv.description}</p>
                  {iv.scheduled_date && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Scheduled: {formatDate(iv.scheduled_date)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="card">
        <div className="portal-panel-head">
          <h2 className="portal-section-title">AI Recommendations</h2>
          <button className="btn-secondary text-sm" onClick={handleGenerateRec} disabled={genLoading}>
            {genLoading ? 'Generating...' : '✨ Generate / Refresh'}
          </button>
        </div>
        {recommendations.length === 0 ? (
          <p className="portal-muted" style={{ color: 'var(--text-3)' }}>No recommendations yet. Click Generate to create one.</p>
        ) : (
          <div className="space-y-3">
            {recommendations.slice(0, 1).map((r) => (
              <div key={r.id} className="prose prose-sm max-w-none whitespace-pre-line" style={{ color: 'var(--text-2)' }}>
                {r.content}
                <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>Generated: {formatDate(r.generated_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Intervention Modal */}
      <AnimatePresence>
        {showIntModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'color-mix(in srgb, var(--bg) 72%, #000 28%)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl w-full max-w-md p-6 border border-white/10"
              style={{ background: 'var(--surface-3)', borderColor: 'var(--border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--shadow), var(--inset)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="portal-section-title">Add Intervention</h2>
                <button onClick={() => setShowIntModal(false)} className="text-xl transition-colors" style={{ color: 'var(--text-3)' }}>×</button>
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); createIntMut.mutate(intForm) }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>Type</label>
                  <select className="input-field" value={intForm.type} onChange={(e) => setIntForm(p => ({ ...p, type: e.target.value }))}>
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>Description</label>
                  <textarea className="input-field min-h-[80px]" required value={intForm.description} onChange={(e) => setIntForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the intervention details..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={createIntMut.isPending} className="btn-primary flex-1">
                    {createIntMut.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" className="btn-secondary flex-1" onClick={() => setShowIntModal(false)}>Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

const Skeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex gap-4"><div className="w-14 h-14 bg-white/[0.08] rounded-full" /><div className="space-y-2"><div className="h-6 bg-white/[0.08] rounded w-48" /><div className="h-4 bg-white/[0.08] rounded w-32" /></div></div>
    <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-24 bg-white/[0.08] rounded-xl" />)}</div>
    <div className="grid grid-cols-2 gap-6"><div className="h-56 bg-white/[0.08] rounded-xl" /><div className="h-56 bg-white/[0.08] rounded-xl" /></div>
  </div>
)

export default StudentDetail
