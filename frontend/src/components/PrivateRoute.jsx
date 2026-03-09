import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  </div>
)

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()

  if (!_hasHydrated) {
    return <Spinner />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleHome = {
      admin: '/admin/dashboard',
      staff: '/staff/dashboard',
      student: '/student/dashboard',
    }
    return <Navigate to={roleHome[user.role] || '/login'} replace />
  }

  return children
}

export default PrivateRoute
