import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'

import PrivateRoute from './components/PrivateRoute'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import useAuthStore from './store/authStore'

// Auth
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminDepartments from './pages/admin/Departments'
import AdminSettings from './pages/admin/Settings'
import AdminModelGovernance from './pages/admin/ModelGovernance'
import AdminBulkUpload from './pages/admin/BulkUpload'

// Staff pages
import StaffDashboard from './pages/staff/Dashboard'
import StaffStudents from './pages/staff/Students'
import StudentDetail from './pages/staff/StudentDetail'
import StaffInterventions from './pages/staff/Interventions'
import StaffUpload from './pages/staff/Upload'

// Student pages
import StudentDashboard from './pages/student/Dashboard'
import StudentPerformance from './pages/student/Performance'
import StudentWhatIf from './pages/student/WhatIf'
import StudentRecommendations from './pages/student/Recommendations'

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/departments': 'Departments',
  '/admin/settings': 'System Settings',
  '/admin/model': 'Model Governance',
  '/admin/bulk-upload': 'Bulk Upload',
  '/staff/dashboard': 'Dashboard',
  '/staff/students': 'My Students',
  '/staff/interventions': 'Interventions',
  '/staff/upload': 'Upload Data',
  '/student/dashboard': 'My Dashboard',
  '/student/performance': 'My Performance',
  '/student/what-if': 'What-If Analysis',
  '/student/recommendations': 'AI Recommendations',
}

const BackgroundOrbs = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute -top-48 -left-36 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[120px] animate-float1"
      style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
    <div className="absolute top-[40%] -right-24 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[120px] animate-float2"
      style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
    <div className="absolute -bottom-24 left-[30%] w-[400px] h-[400px] rounded-full opacity-[0.07] blur-[120px] animate-float3"
      style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }} />
  </div>
)

const AppLayout = ({ children, pagePath }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) return children

  return (
    <div className="flex min-h-screen relative">
      <BackgroundOrbs />
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Navbar
          title={PAGE_TITLES[pagePath] || 'AAIE'}
          onMenuToggle={() => setMobileOpen((o) => !o)}
        />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

const App = () => {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AppLayout pagePath="/admin/dashboard"><AdminDashboard /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AppLayout pagePath="/admin/users"><AdminUsers /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AppLayout pagePath="/admin/departments"><AdminDepartments /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AppLayout pagePath="/admin/settings"><AdminSettings /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/model"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AppLayout pagePath="/admin/model"><AdminModelGovernance /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/bulk-upload"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AppLayout pagePath="/admin/bulk-upload"><AdminBulkUpload /></AppLayout>
            </PrivateRoute>
          }
        />

        {/* Staff routes */}
        <Route
          path="/staff/dashboard"
          element={
            <PrivateRoute allowedRoles={['staff']}>
              <AppLayout pagePath="/staff/dashboard"><StaffDashboard /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/students"
          element={
            <PrivateRoute allowedRoles={['staff']}>
              <AppLayout pagePath="/staff/students"><StaffStudents /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/students/:id"
          element={
            <PrivateRoute allowedRoles={['staff']}>
              <AppLayout pagePath="/staff/students"><StudentDetail /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/interventions"
          element={
            <PrivateRoute allowedRoles={['staff']}>
              <AppLayout pagePath="/staff/interventions"><StaffInterventions /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/upload"
          element={
            <PrivateRoute allowedRoles={['staff']}>
              <AppLayout pagePath="/staff/upload"><StaffUpload /></AppLayout>
            </PrivateRoute>
          }
        />

        {/* Student routes */}
        <Route
          path="/student/dashboard"
          element={
            <PrivateRoute allowedRoles={['student']}>
              <AppLayout pagePath="/student/dashboard"><StudentDashboard /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/student/performance"
          element={
            <PrivateRoute allowedRoles={['student']}>
              <AppLayout pagePath="/student/performance"><StudentPerformance /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/student/what-if"
          element={
            <PrivateRoute allowedRoles={['student']}>
              <AppLayout pagePath="/student/what-if"><StudentWhatIf /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/student/recommendations"
          element={
            <PrivateRoute allowedRoles={['student']}>
              <AppLayout pagePath="/student/recommendations"><StudentRecommendations /></AppLayout>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default App
