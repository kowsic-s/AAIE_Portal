import apiClient from './client'

export const getStudentDashboard = () => apiClient.get('/student/dashboard')
export const getStudentPerformance = () => apiClient.get('/student/performance')
export const whatIfSimulation = (data) => apiClient.post('/student/what-if', data)
export const getOwnRecommendations = () => apiClient.get('/student/recommendations')
export const generateRecommendations = () => apiClient.post('/student/recommendations/generate')
export const getOwnInterventions = () => apiClient.get('/student/interventions')

// ── Aliases used by portal pages ─────────────────────────────────────────────
export const getPerformanceHistory = () => apiClient.get('/student/performance')
export const whatIf = (data) => apiClient.post('/student/what-if', data)
export const getRecommendations = () => apiClient.get('/student/recommendations')
export const generateRecommendation = () => apiClient.post('/student/recommendations/generate')
