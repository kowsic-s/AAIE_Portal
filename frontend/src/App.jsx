import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'

import PrivateRoute from './components/PrivateRoute.jsx'
import Sidebar from './components/Sidebar.jsx'
import Navbar from './components/Navbar.jsx'
import useAuthStore from './store/authStore.js'

// Auth
import LoginPage from './pages/LoginPage.jsx'
import LandingPage from './pages/LandingPage.jsx'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminUsers from './pages/admin/Users.jsx'
import AdminDepartments from './pages/admin/Departments.jsx'
import AdminSettings from './pages/admin/Settings.jsx'
import AdminModelGovernance from './pages/admin/ModelGovernance.jsx'
import AdminBulkUpload from './pages/admin/BulkUpload.jsx'

// Staff pages
import StaffDashboard from './pages/staff/Dashboard.jsx'
import StaffStudents from './pages/staff/Students.jsx'
import StudentDetail from './pages/staff/StudentDetail.jsx'
import StaffInterventions from './pages/staff/Interventions.jsx'
import StaffUpload from './pages/staff/Upload.jsx'

// Student pages
import StudentDashboard from './pages/student/Dashboard.jsx'
import StudentPerformance from './pages/student/Performance.jsx'
import StudentWhatIf from './pages/student/WhatIf.jsx'
import StudentRecommendations from './pages/student/Recommendations.jsx'
import StudentInterventions from './pages/student/Interventions.jsx'

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/departments': 'Departments',
  '/admin/settings': 'Settings',
  '/admin/model': 'Model Governance',
  '/admin/bulk-upload': 'Bulk Upload',
  '/staff/dashboard': 'Dashboard',
  '/staff/students': 'My Students',
  '/staff/interventions': 'Interventions',
  '/staff/upload': 'Upload Data',
  '/student/dashboard': 'My Dashboard',
  '/student/performance': 'My Performance',
  '/student/interventions': 'My Interventions',
  '/student/what-if': 'What-If Analysis',
  '/student/recommendations': 'AI Recommendations',
}

const PAGE_SUBS = {
  '/admin/dashboard': 'Institution Overview',
  '/admin/users': 'Manage Accounts',
  '/admin/departments': 'Manage Departments',
  '/admin/settings': 'Configure System',
  '/admin/model': 'ML Version Control',
  '/admin/bulk-upload': 'Import Records',
  '/staff/dashboard': 'Department Overview',
  '/staff/students': 'Monitor Students',
  '/staff/interventions': 'Track Interventions',
  '/staff/upload': 'Upload Records',
  '/student/dashboard': 'Your Overview',
  '/student/performance': 'Academic Metrics',
  '/student/interventions': 'Support Plan Tracking',
  '/student/what-if': 'Simulate Changes',
  '/student/recommendations': 'AI Insights',
}

const AppLayout = ({ children, pagePath }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) return children

  const portal = pagePath?.startsWith('/staff') ? 'staff' : pagePath?.startsWith('/student') ? 'student' : 'admin'

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }} data-portal={portal}>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[252px]">
        <Navbar
          title={PAGE_TITLES[pagePath] || 'AAIE'}
          subtitle={PAGE_SUBS[pagePath]}
          onMenuToggle={() => setMobileOpen((o) => !o)}
        />
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
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
          path="/student/interventions"
          element={
            <PrivateRoute allowedRoles={['student']}>
              <AppLayout pagePath="/student/interventions"><StudentInterventions /></AppLayout>
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
