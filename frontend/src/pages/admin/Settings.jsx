import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSystemSettings, updateSystemSettings, recalculateRisk } from '../../api/admin'
import { toast } from '../../store/toastStore'

const AdminSettings = () => {
  const qc = useQueryClient()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [weightError, setWeightError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: getSystemSettings,
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    if (data?.data) setForm({ ...data.data })
  }, [data])

  const updateMut = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      setSaved(true)
      toast.success('Settings saved successfully')
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const recalcMut = useMutation({
    mutationFn: recalculateRisk,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      qc.invalidateQueries({ queryKey: ['staff-dashboard'] })
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['student-detail'] })
      qc.invalidateQueries({ queryKey: ['student-dashboard'] })
      qc.invalidateQueries({ queryKey: ['student-performance'] })
      qc.invalidateQueries({ queryKey: ['staff-recommendations'] })
      qc.invalidateQueries({ queryKey: ['student-recommendations'] })
      toast.success('Risk recalculation complete')
    },
  })

  if (isLoading || !form) return <div className="animate-pulse p-6 space-y-4">{[1,2,3,4].map(i=><div key={i} className="h-12 bg-white/[0.08] rounded" />)}</div>

  const totalWeight = +((form.attendance_weight ?? 0) + (form.gpa_weight ?? 0) + (form.reward_weight ?? 0) + (form.activity_weight ?? 0)).toFixed(2)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      setWeightError(`Weights must sum to 1.00 (current: ${totalWeight.toFixed(2)})`)
      return
    }
    setWeightError('')
    updateMut.mutate(form)
  }

  const SliderField = ({ label, fieldKey, min = 0, max = 1, step = 0.01, decimals = 2 }) => (
    <div className="space-y-1">
      <div className="flex justify-between">
        <label className="text-sm font-medium text-[#94a3b8]">{label}</label>
        <span className="text-sm font-mono text-[#3b82f6]">{Number(form[fieldKey]).toFixed(decimals)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={form[fieldKey] ?? min}
        onChange={(e) => setForm(p => ({ ...p, [fieldKey]: parseFloat(e.target.value) }))}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-[#475569]">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )

  const NumberField = ({ label, fieldKey, min, max, step = 0.1 }) => (
    <div>
      <label className="block text-sm font-medium text-[#94a3b8] mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={form[fieldKey] ?? ''}
        onChange={(e) => setForm(p => ({ ...p, [fieldKey]: parseFloat(e.target.value) }))}
        className="input-field"
      />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">System Settings</h1>
        <p className="text-[#94a3b8] mt-1">Configure risk thresholds and feature weights</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Feature Weights */}
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#f0f4ff]">Feature Weights</h2>
            <span className={`text-sm font-mono px-2 py-0.5 rounded ${Math.abs(totalWeight - 1.0) < 0.001 ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]' : 'bg-[rgba(239,68,68,0.12)] text-[#ef4444]'}`}>
              Sum: {totalWeight.toFixed(2)}
            </span>
          </div>
          {weightError && <p className="text-[#ef4444] text-sm">{weightError}</p>}
          <SliderField label="Attendance Weight" fieldKey="attendance_weight" />
          <SliderField label="GPA Weight" fieldKey="gpa_weight" />
          <SliderField label="Reward Points Weight" fieldKey="reward_weight" />
          <SliderField label="Activity Points Weight" fieldKey="activity_weight" />
        </div>

        {/* Risk Thresholds */}
        <div className="card space-y-5">
          <h2 className="font-semibold text-[#f0f4ff]">Risk Thresholds</h2>
          <SliderField label="Medium Risk Threshold" fieldKey="medium_risk_threshold" min={0} max={1} />
          <SliderField label="High Risk Threshold" fieldKey="high_risk_threshold" min={0} max={1} />
        </div>

        {/* Placement Floors */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-[#f0f4ff]">Placement Eligibility Floors</h2>
          <NumberField label="Minimum GPA for Placement" fieldKey="placement_gpa_floor" min={0} max={10} step={0.1} />
          <NumberField label="Minimum Attendance % for Placement" fieldKey="placement_attendance_floor" min={0} max={100} step={1} />
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={updateMut.isPending} className="btn-primary px-6">
            {updateMut.isPending ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            type="button"
            disabled={recalcMut.isPending}
            onClick={() => { if (window.confirm('Recalculate risk for all students?')) recalcMut.mutate() }}
            className="btn-secondary px-6"
          >
            {recalcMut.isPending ? 'Recalculating...' : 'Recalculate All Risk'}
          </button>
          {saved && <span className="text-[#10b981] text-sm font-medium">Settings saved!</span>}
          {recalcMut.isSuccess && <span className="text-[#10b981] text-sm font-medium">Recalculation complete!</span>}
        </div>
      </form>
    </div>
  )
}

export default AdminSettings
