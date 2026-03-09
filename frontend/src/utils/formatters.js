export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatGpa = (gpa) => {
  if (gpa === null || gpa === undefined) return '—'
  return Number(gpa).toFixed(2)
}

export const formatPct = (pct) => {
  if (pct === null || pct === undefined) return '—'
  return `${Number(pct).toFixed(1)}%`
}

export const formatConfidence = (conf) => {
  if (conf === null || conf === undefined) return '—'
  return `${(Number(conf) * 100).toFixed(1)}%`
}

export const capitalise = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}
