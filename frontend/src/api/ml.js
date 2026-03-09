import apiClient from './client'

export const predictSingle = (data) => apiClient.post('/ml/predict', data)
export const predictBatch = (studentIds) =>
  apiClient.post('/ml/predict/batch', { student_ids: studentIds })
export const simulatePrediction = (data) => apiClient.post('/ml/predict/simulate', data)
export const trainModel = () => apiClient.post('/ml/train')
export const getModelInfo = () => apiClient.get('/ml/model/info')
export const getMlHealth = () => apiClient.get('/ml/health')
export const getVersions = () => apiClient.get('/ml/versions')
