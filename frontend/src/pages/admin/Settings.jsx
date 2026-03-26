import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSystemSettings, updateSystemSettings, recalculateRisk } from '../../api/admin'
import { toast } from '../../store/toastStore'

const AdminSettings = () => {
  const qc = useQueryClient()
  const [form, setForm] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: getSystemSettings,
    staleTime: 60 * 1000,
  })

  useEffect(() => { if (data?.data) setForm({ ...data.data }) }, [data])

  const updateMut = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      toast.success('Settings saved')
    },
  })

  const recalcMut = useMutation({
    mutationFn: recalculateRisk,
    onSuccess: () => {
      ;['admin-settings', 'admin-dashboard', 'staff-dashboard', 'students', 'student-detail',
        'student-dashboard', 'student-performance', 'staff-recommendations', 'student-recommendations'
      ].forEach(k => qc.invalidateQueries({ queryKey: [k] }))
      toast.success('Risk recalculated')
    },
  })

  if (isLoading || !form) return (
    <div className="animate-pulse space-y-5">
      <div className="grid grid-cols-2 gap-5">{[1, 2].map(i => <div key={i} className="h-72 rounded-2xl" style={{ background: 'var(--surface)' }} />)}</div>
    </div>
  )

  const totalWeight = +((form.attendance_weight ?? 0) + (form.gpa_weight ?? 0) + (form.reward_weight ?? 0) + (form.activity_weight ?? 0)).toFixed(2)
  const weightOk = Math.abs(totalWeight - 1.0) < 0.001
  const C = 2 * Math.PI * 38

  const handleSave = () => {
    if (!weightOk) { toast.error(`Weights must sum to 1.00 (current: ${totalWeight.toFixed(2)})`); return }
    updateMut.mutate(form)
  }

  const Slider = ({ label, fieldKey, min = 0, max = 1, step = 0.01, color }) => {
    const val = form[fieldKey] ?? min
    const pct = ((val - min) / (max - min)) * 100
    return (
      <div className="py-3.5 px-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.82rem]" style={{ color: 'var(--text-2)' }}>{label}</span>
          <span className="font-display text-[0.9rem] font-bold" style={{ color: 'var(--text-1)' }}>{val.toFixed(max >= 10 ? 1 : 2)}</span>
        </div>
        <div className="relative h-5 flex items-center">
          <div className="absolute inset-x-0 h-[5px] rounded-full" style={{ background: 'var(--surface-3)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color || 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
          </div>
          <input type="range" min={min} max={max} step={step} value={val}
            onChange={e => setForm(p => ({ ...p, [fieldKey]: parseFloat(e.target.value) }))}
            className="w-full relative z-10 opacity-0 cursor-pointer" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Risk Thresholds */}
        <div className="overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow), var(--inset)' }}>
          <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="font-display text-[0.9rem] font-bold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Risk Thresholds
            </span>
          </div>
          <Slider label="Medium Threshold" fieldKey="medium_risk_threshold" color="var(--risk-med)" />
          <Slider label="High Threshold" fieldKey="high_risk_threshold" color="var(--risk-high)" />
          <div className="px-6 py-5">
            <div className="text-[0.72rem] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>Placement Eligibility</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.72rem] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>Min GPA</label>
                <input type="number" className="input-field w-full" min={0} max={10} step={0.1}
                  value={form.placement_gpa_floor ?? ''} onChange={e => setForm(p => ({ ...p, placement_gpa_floor: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-[0.72rem] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>Min Attend %</label>
                <input type="number" className="input-field w-full" min={0} max={100} step={1}
                  value={form.placement_attendance_floor ?? ''} onChange={e => setForm(p => ({ ...p, placement_attendance_floor: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-[0.72rem] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>Min Reward Pts</label>
                <input type="number" className="input-field w-full" min={0} max={500} step={1}
                  value={form.placement_reward_floor ?? ''} onChange={e => setForm(p => ({ ...p, placement_reward_floor: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-[0.72rem] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>Min Activity Pts</label>
                <input type="number" className="input-field w-full" min={0} max={500} step={1}
                  value={form.placement_activity_floor ?? ''} onChange={e => setForm(p => ({ ...p, placement_activity_floor: parseFloat(e.target.value) }))} />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Weights */}
        <div className="overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow), var(--inset)' }}>
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="font-display text-[0.9rem] font-bold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Feature Weights
            </span>
            <svg width="44" height="44" viewBox="0 0 84 84">
              <circle cx="42" cy="42" r="38" fill="none" stroke="var(--surface-3)" strokeWidth="5" />
              <circle cx="42" cy="42" r="38" fill="none" strokeWidth="5"
                stroke={weightOk ? 'var(--risk-low)' : 'var(--risk-high)'}
                strokeDasharray={`${(Math.min(totalWeight, 1.2) / 1.2) * C} ${C}`}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 0.5s ease' }} />
              <text x="42" y="46" textAnchor="middle" fontFamily="Syne" fontSize="13" fontWeight="700"
                fill={weightOk ? 'var(--risk-low)' : 'var(--risk-high)'}>{totalWeight.toFixed(2)}</text>
            </svg>
          </div>
          <Slider label="Attendance" fieldKey="attendance_weight" />
          <Slider label="GPA" fieldKey="gpa_weight" />
          <Slider label="Reward Pts" fieldKey="reward_weight" />
          <Slider label="Activity Pts" fieldKey="activity_weight" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={updateMut.isPending} onClick={handleSave}>
          {updateMut.isPending ? 'Saving...' : 'Save Settings'}
        </button>
        <button className="btn-secondary" disabled={recalcMut.isPending}
          onClick={() => { if (window.confirm('Recalculate risk for all students?')) recalcMut.mutate() }}>
          {recalcMut.isPending ? 'Recalculating...' : 'Recalculate All Risk'}
        </button>
      </div>
    </div>
  )
}

export default AdminSettings
