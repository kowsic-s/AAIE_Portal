import apiClient from './client'

export const loginApi = (email, password) =>
  apiClient.post('/auth/login', { email, password })

export const refreshTokenApi = (refreshToken) =>
  apiClient.post('/auth/refresh', { refresh_token: refreshToken })

export const logoutApi = (refreshToken) =>
  apiClient.post('/auth/logout', { refresh_token: refreshToken })
