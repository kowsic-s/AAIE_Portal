import apiClient from './client'

export const getAdminDashboard = () => apiClient.get('/admin/dashboard')

// Users
export const getUsers = (params) => apiClient.get('/admin/users', { params })
export const createUser = (data) => apiClient.post('/admin/users', data)
export const updateUser = (id, data) => apiClient.put(`/admin/users/${id}`, data)
export const deleteUser = (id) => apiClient.delete(`/admin/users/${id}`)
export const toggleBlockUser = (id) => apiClient.post(`/admin/users/${id}/block`)
export const resetPassword = (id) => apiClient.post(`/admin/users/${id}/reset-password`)

// Departments
export const getDepartments = () => apiClient.get('/admin/departments')
export const createDepartment = (data) => apiClient.post('/admin/departments', data)
export const updateDepartment = (id, data) => apiClient.put(`/admin/departments/${id}`, data)
export const deleteDepartment = (id) => apiClient.delete(`/admin/departments/${id}`)
export const assignMentor = (deptId, data) => apiClient.post(`/admin/departments/${deptId}/assign-mentor`, data)

// Bulk Upload
export const bulkUploadStudents = (formData) =>
  apiClient.post('/admin/bulk-upload/students', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const bulkUploadStaff = (formData) =>
  apiClient.post('/admin/bulk-upload/staff', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// Settings
export const getSettings = () => apiClient.get('/admin/settings')
export const updateSettings = (data) => apiClient.put('/admin/settings', data)
export const recalculatePredictions = () => apiClient.post('/admin/settings/recalculate')

// Model Governance
export const getModelVersions = () => apiClient.get('/admin/model/versions')
export const promoteModel = (versionId) => apiClient.post(`/admin/model/promote/${versionId}`)

// Audit Logs
export const getAuditLogs = (params) => apiClient.get('/admin/audit-logs', { params })

// ── Aliases used by portal pages ─────────────────────────────────────────────
export const listUsers = (params) => apiClient.get('/admin/users', { params })
export const toggleUserActive = (id) => apiClient.post(`/admin/users/${id}/block`)
export const resetUserPassword = (id) => apiClient.post(`/admin/users/${id}/reset-password`)
export const setUserPassword = (id, newPassword) => apiClient.post(`/admin/users/${id}/set-password`, { new_password: newPassword })
export const listDepartments = () => apiClient.get('/admin/departments')
export const getSystemSettings = () => apiClient.get('/admin/settings')
export const updateSystemSettings = (data) => apiClient.put('/admin/settings', data)
export const recalculateRisk = () => apiClient.post('/admin/settings/recalculate')
export const listModelVersions = () => apiClient.get('/admin/model/versions')
export const trainModel = () => apiClient.post('/ml/train')
