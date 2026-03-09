import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { loginApi, logoutApi } from '../api/auth'

export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout, getRole } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => loginApi(email, password),
    onSuccess: (response) => {
      const { access_token, refresh_token, user: userData } = response.data
      login(userData, access_token, refresh_token)

      const roleHome = {
        admin: '/admin/dashboard',
        staff: '/staff/dashboard',
        student: '/student/dashboard',
      }
      navigate(roleHome[userData.role] || '/login')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => {
      const rt = useAuthStore.getState().refreshToken
      return rt ? logoutApi(rt) : Promise.resolve()
    },
    onSettled: () => {
      logout()
      queryClient.clear()
      navigate('/login')
    },
  })

  return {
    user,
    token,
    isAuthenticated,
    role: getRole(),
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
  }
}
