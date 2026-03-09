import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStudentDashboard, whatIf } from '../../api/student'
import RiskBadge from '../../components/RiskBadge'
import { motion } from 'framer-motion'

const FEATURES = [
  { key: 'attendance_pct', label: 'Attendance %', min: 0, max: 100, step: 1 },
  { key: 'gpa', label: 'GPA', min: 0, max: 10, step: 0.1 },
  { key: 'reward_points', label: 'Reward Points', min: 0, max: 500, step: 5 },
  { key: 'activity_points', label: 'Activity Points', min: 0, max: 300, step: 5 },
]

const StudentWhatIf = () => {
  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: getStudentDashboard,
    staleTime: 5 * 60 * 1000,
  })

  const currentPerf = dashData?.data?.latest_performance ?? {}
  const currentPred = dashData?.data?.latest_prediction ?? {}

  const [values, setValues] = useState({
    attendance_pct: 75,
    gpa: 6.0,
    reward_points: 50,
    activity_points: 30,
  })
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState(null)

  // Pre-fill from current performance
  useEffect(() => {
    if (currentPerf && currentPerf.gpa != null) {
      setValues({
        attendance_pct: Number(currentPerf.attendance_pct ?? 75),
        gpa: Number(currentPerf.gpa ?? 6),
        reward_points: Number(currentPerf.reward_points ?? 50),
        activity_points: Number(currentPerf.activity_points ?? 30),
      })
    }
  }, [currentPerf.gpa])

  const runSimulation = useCallback(async (vals) => {
    setSimLoading(true)
    try {
      const res = await whatIf(vals)
      setSimResult(res.data)
    } catch {
      // silent
    } finally {
      setSimLoading(false)
    }
  }, [])

  const handleSliderChange = (key, val) => {
    const newValues = { ...values, [key]: parseFloat(val) }
    setValues(newValues)
    if (debounceTimer) clearTimeout(debounceTimer)
    const t = setTimeout(() => runSimulation(newValues), 500)
    setDebounceTimer(t)
  }

  if (dashLoading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-white/[0.08] rounded w-48" /><div className="h-64 bg-white/[0.08] rounded-xl" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">What-If Simulator</h1>
        <p className="text-[#94a3b8] mt-1">Adjust your metrics to see how they affect your risk level</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="card space-y-6">
          <h2 className="font-semibold text-[#f0f4ff]">Adjust Metrics</h2>
          {FEATURES.map((f) => (
            <div key={f.key} className="space-y-1">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-[#94a3b8]">{f.label}</label>
                <span className="text-sm font-mono text-[#3b82f6]">
                  {f.step < 1 ? Number(values[f.key]).toFixed(1) : Number(values[f.key])}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#475569] w-6">{f.min}</span>
                <input
                  type="range"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={values[f.key]}
                  onChange={(e) => handleSliderChange(f.key, e.target.value)}
                  className="flex-1 accent-blue-600"
                />
                <span className="text-xs text-[#475569] w-8 text-right">{f.max}</span>
              </div>
              {currentPerf[f.key] != null && (
                <p className="text-xs text-[#475569]">Current: {Number(currentPerf[f.key]).toFixed(f.step < 1 ? 1 : 0)}</p>
              )}
            </div>
          ))}
        </div>

        {/* Result */}
        <div className="space-y-4">
          {/* Current */}
          <div className="card border border-white/10">
            <h3 className="text-sm font-medium text-[#94a3b8] mb-2">Current Risk</h3>
            <RiskBadge level={currentPred.risk_level} size="lg" />
            {currentPred.confidence != null && (
              <p className="text-sm text-[#94a3b8] mt-2">Confidence: {(currentPred.confidence * 100).toFixed(0)}%</p>
            )}
          </div>

          {/* Simulated */}
          <motion.div
            key={simResult?.risk_level}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border border-[rgba(59,130,246,0.3)]"
            style={{ background: 'rgba(59,130,246,0.06)' }}
          >
            <h3 className="text-sm font-medium text-[#3b82f6] mb-2">Simulated Risk</h3>
            {simLoading ? (
              <div className="flex items-center gap-2 text-[#94a3b8] text-sm">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Calculating...
              </div>
            ) : simResult ? (
              <>
                <RiskBadge level={simResult.risk_level} size="lg" />
                <p className="text-sm text-[#94a3b8] mt-2">Confidence: {(simResult.confidence * 100).toFixed(0)}%</p>
                {simResult.risk_level !== currentPred.risk_level && (
                  <p className="text-sm font-medium text-[#3b82f6] mt-1">
                    ✨ Risk would change from <strong>{currentPred.risk_level}</strong> to <strong>{simResult.risk_level}</strong>
                  </p>
                )}
                {simResult.probability_breakdown && (
                  <div className="mt-3 space-y-1">
                    {Object.entries(simResult.probability_breakdown).map(([label, p]) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-xs text-[#94a3b8] w-16">{label}</span>
                        <div className="flex-1 bg-white/[0.08] rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${label === 'High' ? 'bg-[#ef4444]' : label === 'Medium' ? 'bg-[#f59e0b]' : 'bg-[#10b981]'}`} style={{ width: `${(p * 100).toFixed(1)}%` }} />
                        </div>
                        <span className="text-xs font-mono text-[#94a3b8] w-10 text-right">{(p * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-[#94a3b8]">Move the sliders to simulate.</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default StudentWhatIf
