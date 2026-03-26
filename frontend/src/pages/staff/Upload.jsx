import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { uploadPerformance } from '../../api/staff'

const REQUIRED_COLUMNS = ['student_code', 'gpa', 'attendance_pct', 'reward_points', 'activity_points', 'semester']

const StaffUpload = () => {
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const uploadMut = useMutation({
    mutationFn: (f) => {
      const fd = new FormData()
      fd.append('file', f)
      return uploadPerformance(fd)
    },
  })

  const pickFile = (f) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const lines = String(e.target?.result || '').split('\n').filter(Boolean)
      const headers = (lines[0] || '').split(',').map((h) => h.trim())
      const rows = lines.slice(1, 6).map((line) => {
        const vals = line.split(',').map((v) => v.trim())
        return headers.reduce((acc, h, i) => ({ ...acc, [h]: vals[i] ?? '' }), {})
      })
      setPreview({ headers, rows })
    }
    reader.readAsText(f)
  }

  return (
    <div className="staff-page">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="staff-shell">
          <div className="staff-shell-accent" />
          <div className="staff-shell-head"><div className="staff-shell-title">Upload Student Records</div></div>
          <div className="p-5 space-y-4">
            <div className="text-sm px-3 py-2 rounded-lg" style={{ color: 'var(--text-2)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              Required columns: student_code, semester, attendance_pct, gpa, reward_points, activity_points
            </div>

            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer ${dragOver ? 'border-[#22d3ee]' : 'border-white/10'}`}
              style={{ background: 'var(--surface)' }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]) }}
            >
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
              <div className="mb-3 flex justify-center">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.6">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              {file ? (
                <p style={{ color: 'var(--text-1)' }}>{file.name}</p>
              ) : (
                <>
                  <p style={{ color: 'var(--text-1)' }}>Drop your CSV here</p>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>or click to browse</p>
                </>
              )}
            </div>

            {file && (
              <button className="btn-primary" onClick={() => uploadMut.mutate(file)} disabled={uploadMut.isPending}>
                {uploadMut.isPending ? 'Uploading...' : 'Upload'}
              </button>
            )}

            {preview && (
              <div className="rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>{preview.headers.map((h) => <th key={h} className="px-3 py-2 text-left" style={{ color: 'var(--text-2)' }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        {preview.headers.map((h) => <td key={h} className="px-3 py-2" style={{ color: 'var(--text-2)' }}>{row[h]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="staff-shell">
          <div className="staff-shell-accent" style={{ background: 'linear-gradient(90deg,var(--accent-2),var(--accent-3))' }} />
          <div className="staff-shell-head"><div className="staff-shell-title">CSV Format Guide</div></div>
          <div className="p-5">
            <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>Your CSV must include:</p>
            <div className="space-y-2 mb-4">
              {REQUIRED_COLUMNS.map((c, i) => (
                <div key={c} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <span className="w-5 h-5 rounded-full text-[0.65rem] font-bold flex items-center justify-center" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: '#09111f' }}>{i + 1}</span>
                  <code style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>{c}</code>
                </div>
              ))}
            </div>
            <div className="text-xs rounded-lg px-3 py-2" style={{ color: 'var(--text-2)', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
              Use exact header names to avoid upload validation errors.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffUpload
