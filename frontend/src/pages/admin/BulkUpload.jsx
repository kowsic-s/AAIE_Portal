import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { bulkUploadStudents, bulkUploadStaff } from '../../api/admin.js'
import { toast } from '../../store/toastStore.js'

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
      <div className="flex items-center justify-between">
        <span className="text-[0.82rem]" style={{ color: 'var(--text-2)' }}>Import students or staff accounts via CSV</span>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {UPLOAD_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => switchType(t)}
            className="px-4 py-2 rounded-lg text-[0.82rem] font-semibold transition-all"
            style={activeType.key === t.key
              ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 0 12px var(--glow-a)' }
              : { color: 'var(--text-3)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Hint + Example */}
      <div className="rounded-xl px-5 py-3.5 space-y-2" style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)' }}>
        <p className="text-[0.82rem] font-medium" style={{ color: 'var(--accent)' }}>{activeType.hint}</p>
        <details className="text-[0.82rem]" style={{ color: 'var(--text-2)' }}>
          <summary className="cursor-pointer select-none text-[0.68rem] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
            Show example
          </summary>
          <pre className="mt-2 rounded p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
            {activeType.example}
          </pre>
        </details>
      </div>

      {/* Drop Zone */}
      <div
        className="border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer"
        style={{ borderColor: dragOver ? 'var(--accent)' : 'var(--border)', background: dragOver ? 'rgba(79,142,247,0.08)' : 'var(--surface)' }}
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
          <p className="font-medium" style={{ color: 'var(--text-1)' }}>
            {file.name}{' '}
            <span className="text-sm" style={{ color: 'var(--text-3)' }}>({(file.size / 1024).toFixed(1)} KB)</span>
          </p>
        ) : (
          <>
            <p className="font-medium" style={{ color: 'var(--text-1)' }}>Drop your CSV here, or click to browse</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>.csv files only</p>
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
            className="overflow-x-auto overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow), var(--inset)' }}
          >
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="font-display text-[0.9rem] font-bold" style={{ color: 'var(--text-1)' }}>Preview (first 5 rows)</span>
            </div>
            <table className="text-sm w-full">
              <thead>
                <tr>
                  {preview.headers.map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-[0.68rem] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i}>
                    {preview.headers.map((h) => (
                      <td key={h} className="py-2.5 px-4 text-[0.82rem]" style={{ color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{row[h]}</td>
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
        <div className="rounded-xl px-5 py-3 text-[0.82rem]" style={{ color: 'var(--risk-high)', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          Upload failed: {uploadMut.error?.response?.data?.detail ?? uploadMut.error?.message ?? 'Unknown error'}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 p-6 overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow), var(--inset)' }}
          >
            <span className="font-display text-[0.9rem] font-bold" style={{ color: 'var(--text-1)' }}>Upload Result</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl p-4 text-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p className="font-display text-[1.6rem] font-extrabold" style={{ color: 'var(--text-1)' }}>{result.total}</p>
                <p className="text-[0.75rem]" style={{ color: 'var(--text-3)' }}>Total Rows</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <p className="font-display text-[1.6rem] font-extrabold" style={{ color: 'var(--risk-low)' }}>{result.created}</p>
                <p className="text-[0.75rem]" style={{ color: 'var(--risk-low)' }}>Created</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
                <p className="font-display text-[1.6rem] font-extrabold" style={{ color: 'var(--risk-med)' }}>{result.skipped ?? result.updated ?? 0}</p>
                <p className="text-[0.75rem]" style={{ color: 'var(--risk-med)' }}>Skipped</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>
                <p className="font-display text-[1.6rem] font-extrabold" style={{ color: 'var(--risk-high)' }}>{result.errors?.length ?? result.failed ?? 0}</p>
                <p className="text-[0.75rem]" style={{ color: 'var(--risk-high)' }}>Errors</p>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[0.82rem] font-semibold" style={{ color: 'var(--risk-high)' }}>Row Errors</h3>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-xs rounded px-3 py-1.5" style={{ color: 'var(--risk-high)', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
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
