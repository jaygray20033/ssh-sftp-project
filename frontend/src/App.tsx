import { useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './stores/authStore'

import { ProtectedRoute } from './components/ProtectedRoute'
import { GuestRoute } from './components/GuestRoute'
import { AppLayout } from './components/layout/AppLayout'

import LoginPage from './pages/auth/login'
import RegisterPage from './pages/auth/register'
import TwoFactorPage from './pages/auth/two-factor'
import ForgotPasswordPage from './pages/auth/forgot-password'
import ResetPasswordPage from './pages/auth/reset-password'
import VerifyEmailPage from './pages/auth/verify-email'
import CallbackPage from './pages/auth/callback'

import DashboardPage from './pages/dashboard'
import HostsPage from './pages/hosts'
import TerminalPage from './pages/terminal'
import FilesPage from './pages/files'
import ReplayPage from './pages/replay'
import SettingsPage from './pages/settings'
import NotFoundPage from './pages/not-found'

function App() {
  const initAuth = useAuthStore((s) => s.initAuth)
  const initCalled = useRef(false)

  useEffect(() => {
    if (initCalled.current) return
    initCalled.current = true
    initAuth()
  }, [initAuth])

  return (
    <>
      <Toaster richColors position='top-right' />
      <Routes>
        {/* Root redirect */}
        <Route path='/' element={<Navigate to='/dashboard' replace />} />

        {/* Guest-only auth pages */}
        <Route
          path='/login'
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path='/register'
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route path='/2fa' element={<TwoFactorPage />} />
        <Route
          path='/forgot-password'
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route path='/reset-password' element={<ResetPasswordPage />} />
        <Route path='/verify-email' element={<VerifyEmailPage />} />
        <Route path='/callback' element={<CallbackPage />} />

        {/* Protected app pages */}
        <Route
          path='/dashboard'
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/hosts'
          element={
            <ProtectedRoute>
              <AppLayout>
                <HostsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/terminal'
          element={
            <ProtectedRoute>
              <AppLayout>
                <TerminalPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/files'
          element={
            <ProtectedRoute>
              <AppLayout>
                <FilesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/files/:hostId'
          element={
            <ProtectedRoute>
              <AppLayout>
                <FilesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/sessions/:id/replay'
          element={
            <ProtectedRoute>
              <AppLayout>
                <ReplayPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/settings'
          element={
            <ProtectedRoute>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
