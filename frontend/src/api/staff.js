import apiClient from './client'

export const getStaffDashboard = () => apiClient.get('/staff/dashboard')
export const getStaffStudents = (params) => apiClient.get('/staff/students', { params })
export const getStudentDetail = (id) => apiClient.get(`/staff/students/${id}`)
export const uploadStudentRecords = (studentId, formData) =>
  apiClient.post(`/staff/students/${studentId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const getInterventions = (params) => apiClient.get('/staff/interventions', { params })
export const createIntervention = (studentIdOrData, data) => {
  // Always POST to /staff/interventions — merge studentId into payload when provided separately
  if (data !== undefined) {
    return apiClient.post('/staff/interventions', { ...data, student_id: studentIdOrData })
  }
  return apiClient.post('/staff/interventions', studentIdOrData)
}
export const updateIntervention = (id, data) => apiClient.put(`/staff/interventions/${id}`, data)
export const getStudentRecommendations = (studentId) =>
  apiClient.get(`/staff/students/${studentId}/recommendations`)
export const uploadPerformanceFile = (formData) =>
  apiClient.post('/staff/students/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ── Aliases used by portal pages ─────────────────────────────────────────────
// StudentDetail imports these names
export const getRecommendations = (studentId) =>
  apiClient.get(`/staff/students/${studentId}/recommendations`)
export const generateRecommendation = (studentId) =>
  apiClient.post(`/staff/students/${studentId}/recommendations/generate`)
// Staff Upload page imports
export const uploadStudents = (formData) =>
  apiClient.post('/staff/students/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const uploadPerformance = (formData) =>
  apiClient.post('/staff/students/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
