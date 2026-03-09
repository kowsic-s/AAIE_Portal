import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecommendations, generateRecommendation } from '../../api/student'
import { formatDate } from '../../utils/formatters'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '../../store/toastStore'

const StudentRecommendations = () => {
  const qc = useQueryClient()
  const [generating, setGenerating] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-recommendations'],
    queryFn: getRecommendations,
    staleTime: 5 * 60 * 1000,
  })

  const recommendations = data?.data?.recommendations ?? []
  const latest = recommendations[0] ?? null

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await generateRecommendation()
      qc.invalidateQueries({ queryKey: ['student-recommendations'] })
      toast.success('Recommendation generated')
    } catch {
      toast.error('Failed to generate recommendation')
    } finally {
      setGenerating(false)
    }
  }

  if (isError) return <div className="text-[#ef4444] p-6">Failed to load recommendations.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f4ff]">AI Recommendations</h1>
          <p className="text-[#94a3b8] mt-1">Personalised guidance powered by Gemini AI</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </span>
          ) : '✨ Generate / Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1,2].map(i => <div key={i} className="h-48 bg-white/[0.08] rounded-xl" />)}
        </div>
      ) : !latest ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="font-semibold text-[#f0f4ff] mb-2">No recommendations yet</h2>
          <p className="text-[#94a3b8] text-sm mb-4">Click "Generate / Refresh" to get personalised AI guidance.</p>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            key={latest.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Latest recommendation */}
            <div className="card border border-[rgba(59,130,246,0.3)]" style={{ background: 'rgba(59,130,246,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <h2 className="font-semibold text-[#3b82f6]">Latest Recommendation</h2>
                </div>
                <span className="text-xs text-[#475569]">Generated: {formatDate(latest.generated_at)}</span>
              </div>
              <div className="prose prose-sm max-w-none text-[#94a3b8] whitespace-pre-line leading-relaxed">
                {latest.content}
              </div>
            </div>

            {/* Older recommendations */}
            {recommendations.slice(1, 4).length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-[#94a3b8] text-sm">Previous Recommendations</h3>
                {recommendations.slice(1, 4).map((r) => (
                  <div key={r.id} className="card border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#475569]">Generated: {formatDate(r.generated_at)}</span>
                    </div>
                    <p className="text-sm text-[#94a3b8] line-clamp-4 whitespace-pre-line">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

export default StudentRecommendations
