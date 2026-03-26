import { useState, useMemo, useEffect } from 'react'

const Skeleton = ({ rows = 5, cols = 4 }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-4 rounded flex-1" style={{ background: 'var(--surface-2)' }} />
        ))}
      </div>
    ))}
  </div>
)

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  onRowClick,
  searchable = true,
  sortable = true,
  pageSize: pageSizeProp = 10,
}) => {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const pageSize = pageSizeProp

  const safeData = useMemo(() => Array.isArray(data) ? data : [], [data])

  // Reset page when data changes
  useEffect(() => { setPage(1) }, [data])

  const filtered = useMemo(() => {
    if (!search) return safeData
    const q = search.toLowerCase()
    return safeData.filter((row) =>
      columns.some((col) => {
        const field = col.accessor ?? col.key
        const val = field ? row[field] : ''
        return String(val ?? '').toLowerCase().includes(q)
      })
    )
  }, [safeData, search, columns])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? ''
      const bVal = b[sortKey] ?? ''
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (key) => {
    if (!sortable) return
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9 pr-3 py-2 rounded-xl text-sm w-full border focus:outline-none focus:ring-2 transition-all"
              style={{
                color: 'var(--text-1)',
                borderColor: 'var(--border)',
                background: 'var(--surface-2)',
                boxShadow: 'none',
              }}
            />
          </div>
          <span className="text-sm" style={{ color: 'var(--text-2)' }}>{filtered.length} results</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {columns.map((col) => {
                const field = col.accessor ?? col.key
                return (
                  <th
                    key={field ?? col.label}
                    onClick={() => field && handleSort(field)}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider select-none ${
                      field && sortable ? 'cursor-pointer' : ''
                    }`}
                    style={{ color: 'var(--text-2)' }}
                  >
                    <span className="flex items-center gap-1">
                      {col.label ?? col.header}
                      {sortable && field && sortKey === field && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-4">
                  <Skeleton rows={5} cols={columns.length} />
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10" style={{ color: 'var(--text-3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>No data found</p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  {columns.map((col) => {
                    const field = col.accessor ?? col.key
                    const value = field ? row[field] : undefined
                    return (
                      <td key={field ?? col.label} className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--text-2)' }}>
                        {col.render ? col.render(value, row) : (value ?? null)}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-2)' }}>
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded-lg border disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-2)', background: 'var(--surface)' }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-lg border disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-2)', background: 'var(--surface)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
