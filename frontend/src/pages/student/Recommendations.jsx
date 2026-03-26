import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecommendations, generateRecommendation } from '../../api/student.js'
import { formatDate } from '../../utils/formatters.js'
import { motion } from 'framer-motion'
import { toast } from '../../store/toastStore.js'

const StudentRecommendations = () => {
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([{ id: 1, role: 'assistant', text: 'Hi, ask about GPA, attendance, placement readiness, or interventions.' }])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-recommendations'],
    queryFn: getRecommendations,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const generateMut = useMutation({
    mutationFn: generateRecommendation,
    onSuccess: async () => {
      const refreshed = await qc.fetchQuery({ queryKey: ['student-recommendations'], queryFn: getRecommendations })
      const latest = refreshed?.data?.recommendations?.[0]
      if (latest?.content) setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', text: latest.content }])
      toast.success('New recommendation generated')
    },
    onError: () => toast.error('Failed to generate recommendation'),
  })

  const recommendations = data?.data?.recommendations ?? []
  const latest = recommendations[0] ?? null
  const knowledgeBase = useMemo(() => latest?.content || '', [latest])

  const reply = (question) => {
    const q = question.toLowerCase()
    if (!knowledgeBase) return 'No recommendation yet. Click Generate New Advice first.'
    if (q.includes('attendance')) return `Attendance focus:\n\n${knowledgeBase}`
    if (q.includes('gpa') || q.includes('grade')) return `GPA plan:\n\n${knowledgeBase}`
    if (q.includes('placement')) return `Placement tips:\n\n${knowledgeBase}`
    return knowledgeBase
  }

  const send = () => {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text }, { id: Date.now() + 1, role: 'assistant', text: reply(text) }])
    setInput('')
  }

  if (isError) return <div className="p-6" style={{ color: 'var(--risk-high)' }}>Failed to load recommendations.</div>

  return (
    <div className="student-page">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => generateMut.mutate()} disabled={generateMut.isPending}>{generateMut.isPending ? 'Generating...' : 'Generate New Advice'}</button>
      </div>

      <div className="student-shell">
        <div className="student-shell-accent" />
        <div className="student-shell-head">
          <div className="student-shell-title">AI Recommendation Chat</div>
          {latest?.generated_at && <span className="text-xs" style={{ color: 'var(--text-3)' }}>Updated: {formatDate(latest.generated_at)}</span>}
        </div>

        <div className="p-4 h-[50vh] overflow-y-auto space-y-3" style={{ background: 'var(--surface-2)' }}>
          {isLoading && <div style={{ color: 'var(--text-3)' }}>Loading...</div>}
          {!isLoading && messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line" style={m.role === 'user' ? { background: 'var(--accent-2)', color: '#fff' } : { background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <input className="input-field" placeholder="Ask about your progress..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send() } }} />
            <button className="btn-primary" onClick={send}>Send</button>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="student-shell">
          <div className="student-shell-accent" />
          <div className="student-shell-head"><div className="student-shell-title">Recent Recommendation Snapshots</div></div>
          <div className="p-4 space-y-2">
            {recommendations.slice(0, 3).map((r) => (
              <div key={r.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{formatDate(r.generated_at)}</div>
                <p className="text-sm line-clamp-3 whitespace-pre-line" style={{ color: 'var(--text-2)' }}>{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentRecommendations
