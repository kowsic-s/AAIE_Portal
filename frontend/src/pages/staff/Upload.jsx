import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { uploadPerformance } from '../../api/staff'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '../../store/toastStore'

const UPLOAD_TYPES = [
  { key: 'performance', label: 'Performance CSV', mutFn: uploadPerformance, accept: '.csv', hint: 'Required columns: student_code, semester, attendance_pct, gpa, reward_points, activity_points' },
]

const StaffUpload = () => {
  const [activeType, setActiveType] = useState(UPLOAD_TYPES[0])
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const uploadMut = useMutation({
    mutationFn: (f) => {
      const fd = new FormData()
      fd.append('file', f)
      return activeType.mutFn(fd)
    },
    onSuccess: (res) => {
      const d = res?.data
      toast.success(`Upload complete: ${d?.created ?? 0} created, ${d?.failed ?? 0} failed`)
    },
  })

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) { alert('Please upload a CSV file.'); return }
    setFile(f)
    uploadMut.reset()

    // Parse first 5 rows for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const lines = e.target.result.split('\n').filter(Boolean)
      const headers = lines[0]?.split(',').map(h => h.trim())
      const rows = lines.slice(1, 6).map(line => {
        const vals = line.split(',').map(v => v.trim())
        return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i] ?? '' }), {})
      })
      setPreview({ headers, rows })
    }
    reader.readAsText(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const handleSubmit = () => {
    if (!file) return
    uploadMut.mutate(file)
  }

  const result = uploadMut.data?.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">Bulk Upload</h1>
        <p className="text-[#94a3b8] mt-1">Import students or performance data via CSV</p>
      </div>

      {/* Type selector */}
      <div className="flex gap-3">
        {UPLOAD_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveType(t); setFile(null); setPreview(null); uploadMut.reset() }}
            className={`px-4 py-2 rounded-lg font-medium text-sm border transition-colors ${
              activeType.key === t.key ? 'bg-[#3b82f6] text-white border-[#3b82f6]' : 'text-[#94a3b8] border-white/10 bg-white/[0.05]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-[#94a3b8] px-4 py-2 rounded-lg border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>{activeType.hint}</p>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-[#3b82f6] bg-[rgba(59,130,246,0.08)]' : 'border-white/10 hover:border-[#3b82f6]/40'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        <div className="text-4xl mb-3">📂</div>
        {file ? (
          <p className="font-medium text-[#f0f4ff]">{file.name} <span className="text-[#475569] text-sm">({(file.size / 1024).toFixed(1)} KB)</span></p>
        ) : (
          <>
            <p className="font-medium text-[#f0f4ff]">Drop your CSV here, or click to browse</p>
            <p className="text-[#475569] text-sm mt-1">.csv files only</p>
          </>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="card overflow-x-auto">
          <h2 className="font-semibold text-[#f0f4ff] mb-3">Preview (first 5 rows)</h2>
          <table className="text-sm w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {preview.headers.map(h => <th key={h} className="text-left py-2 px-3 text-[#94a3b8] font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.06] last:border-0">
                  {preview.headers.map(h => <td key={h} className="py-2 px-3 text-[#94a3b8]">{row[h]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload button */}
      {file && !uploadMut.isSuccess && (
        <button
          className="btn-primary px-8"
          onClick={handleSubmit}
          disabled={uploadMut.isPending}
        >
          {uploadMut.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading...
            </span>
          ) : `Upload ${activeType.label}`}
        </button>
      )}

      {uploadMut.isError && (
        <div className="text-sm rounded-xl px-4 py-3 text-[#ef4444] border border-[rgba(239,68,68,0.3)]" style={{ background: 'rgba(239,68,68,0.08)' }}>
          {uploadMut.error?.response?.data?.detail ?? 'Upload failed. Please check your CSV format.'}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card border border-[rgba(16,185,129,0.3)]" style={{ background: 'rgba(16,185,129,0.06)' }}>
            <h2 className="font-semibold text-[#10b981] mb-3">Upload Complete</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#10b981]">{result.created ?? 0}</p>
                <p className="text-xs text-[#10b981]">Created</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#f59e0b]">{result.updated ?? 0}</p>
                <p className="text-xs text-[#f59e0b]">Updated</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#ef4444]">{result.failed ?? 0}</p>
                <p className="text-xs text-[#ef4444]">Failed</p>
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div className="mt-3 text-xs text-[#ef4444] space-y-1">
                {result.errors.slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
            <button className="btn-secondary mt-4 text-sm" onClick={() => { setFile(null); setPreview(null); uploadMut.reset() }}>
              Upload Another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StaffUpload
