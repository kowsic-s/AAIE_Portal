import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { bulkUploadStudents, bulkUploadStaff } from '../../api/admin'
import { toast } from '../../store/toastStore'

const UPLOAD_TYPES = [
  {
    key: 'students',
    label: 'Students CSV',
    mutFn: bulkUploadStudents,
    accept: '.csv',
    hint: 'Required columns: name, email, student_code, department_code, batch_year',
    example: 'name,email,student_code,department_code,batch_year\nJohn Doe,john@aaie.edu,CS2024001,CS,2024',
  },
  {
    key: 'staff',
    label: 'Staff CSV',
    mutFn: bulkUploadStaff,
    accept: '.csv',
    hint: 'Required columns: name, email, employee_code, department_code',
    example: 'name,email,employee_code,department_code\nDr. Jane Smith,jane@aaie.edu,EMP-CS-001,CS',
  },
]

const AdminBulkUpload = () => {
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
      toast.success(`Upload complete: ${d?.created ?? 0} created, ${d?.errors?.length ?? d?.failed ?? 0} errors`)
    },
  })

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a .csv file.')
      return
    }
    setFile(f)
    uploadMut.reset()

    const reader = new FileReader()
    reader.onload = (e) => {
      const lines = e.target.result.split('\n').filter(Boolean)
      const headers = lines[0]?.split(',').map((h) => h.trim())
      const rows = lines.slice(1, 6).map((line) => {
        const vals = line.split(',').map((v) => v.trim())
        return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i] ?? '' }), {})
      })
      setPreview({ headers, rows })
    }
    reader.readAsText(f)
  }

  const switchType = (t) => {
    setActiveType(t)
    setFile(null)
    setPreview(null)
    uploadMut.reset()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
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
        <p className="text-[#94a3b8] mt-1">Import students or staff accounts via CSV</p>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-3">
        {UPLOAD_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => switchType(t)}
            className={`px-4 py-2 rounded-lg font-medium text-sm border transition-colors ${
              activeType.key === t.key
                ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
                : 'text-[#94a3b8] border-white/10 hover:border-[#3b82f6]/40 bg-white/[0.05]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Hint + Example */}
      <div className="rounded-xl px-4 py-3 space-y-2 border border-[rgba(59,130,246,0.3)]" style={{ background: 'rgba(59,130,246,0.08)' }}>
        <p className="text-sm font-medium text-[#3b82f6]">{activeType.hint}</p>
        <details className="text-sm text-[#94a3b8]">
          <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-[#3b82f6]/70">
            Show example
          </summary>
          <pre className="mt-2 border border-white/10 rounded p-3 text-xs font-mono text-[#94a3b8] overflow-x-auto whitespace-pre-wrap" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {activeType.example}
          </pre>
        </details>
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-[#3b82f6] bg-[rgba(59,130,246,0.08)]' : 'border-white/10 hover:border-[#3b82f6]/40 hover:bg-white/[0.03]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="text-4xl mb-3">📂</div>
        {file ? (
          <p className="font-medium text-[#f0f4ff]">
            {file.name}{' '}
            <span className="text-[#475569] text-sm">({(file.size / 1024).toFixed(1)} KB)</span>
          </p>
        ) : (
          <>
            <p className="font-medium text-[#f0f4ff]">Drop your CSV here, or click to browse</p>
            <p className="text-[#475569] text-sm mt-1">.csv files only</p>
          </>
        )}
      </div>

      {/* Preview Table */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card overflow-x-auto"
          >
            <h2 className="font-semibold text-[#f0f4ff] mb-3">Preview (first 5 rows)</h2>
            <table className="text-sm w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {preview.headers.map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-[#94a3b8] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.06] last:border-0">
                    {preview.headers.map((h) => (
                      <td key={h} className="py-2 px-3 text-[#94a3b8]">{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      {file && !result && (
        <button
          onClick={handleSubmit}
          disabled={uploadMut.isPending}
          className="btn-primary px-8"
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

      {/* Error */}
      {uploadMut.isError && (
        <div className="rounded-xl px-4 py-3 text-sm text-[#ef4444] border border-[rgba(239,68,68,0.3)]" style={{ background: 'rgba(239,68,68,0.1)' }}>
          Upload failed: {uploadMut.error?.response?.data?.detail ?? uploadMut.error?.message ?? 'Unknown error'}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card space-y-4"
          >
            <h2 className="font-semibold text-[#f0f4ff]">Upload Result</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl p-4 text-center border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <p className="text-2xl font-bold text-[#f0f4ff]">{result.total}</p>
                <p className="text-sm text-[#94a3b8] mt-0.5">Total Rows</p>
              </div>
              <div className="rounded-xl p-4 text-center border border-[rgba(16,185,129,0.3)]" style={{ background: 'rgba(16,185,129,0.08)' }}>
                <p className="text-2xl font-bold text-[#10b981]">{result.created}</p>
                <p className="text-sm text-[#10b981] mt-0.5">Created</p>
              </div>
              <div className="rounded-xl p-4 text-center border border-[rgba(245,158,11,0.3)]" style={{ background: 'rgba(245,158,11,0.08)' }}>
                <p className="text-2xl font-bold text-[#f59e0b]">{result.skipped ?? result.updated ?? 0}</p>
                <p className="text-sm text-[#f59e0b] mt-0.5">Skipped</p>
              </div>
              <div className="rounded-xl p-4 text-center border border-[rgba(239,68,68,0.3)]" style={{ background: 'rgba(239,68,68,0.08)' }}>
                <p className="text-2xl font-bold text-[#ef4444]">{result.errors?.length ?? result.failed ?? 0}</p>
                <p className="text-sm text-[#ef4444] mt-0.5">Errors</p>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#ef4444]">Row Errors</h3>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-xs rounded px-3 py-1.5 text-[#ef4444] border border-[rgba(239,68,68,0.2)]" style={{ background: 'rgba(239,68,68,0.06)' }}>
                      <span className="font-semibold">Row {e.row}:</span> {e.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => { setFile(null); setPreview(null); uploadMut.reset() }}
              className="btn-secondary text-sm"
            >
              Upload Another File
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminBulkUpload
