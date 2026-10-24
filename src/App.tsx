import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { WalletProvider } from './context/WalletContext'
import { Toaster } from 'sonner'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Button } from './components/common/Button'

// Pages
import { LandingPage } from './pages/LandingPage'
import { ExploreBountiesPage } from './pages/ExploreBountiesPage'
import { BountyDetailPage } from './pages/BountyDetailPage'
import { CreateBountyPage } from './pages/CreateBountyPage'
import { EditBountyPage } from './pages/EditBountyPage'
import { CreatorDashboardPage } from './pages/CreatorDashboardPage'
import { DeveloperDashboardPage } from './pages/DeveloperDashboardPage'
import { WorkroomPage } from './pages/WorkroomPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
      <h1 className="text-6xl font-extrabold font-mono text-[#24D6B1]">404</h1>
      <h2 className="text-2xl font-bold text-[#F4F5F1] font-display">Page Not Found</h2>
      <p className="text-xs text-[#8E9894]">The bounty page or route you navigated to does not exist.</p>
      <Link to="/" className="inline-block pt-2">
        <Button size="sm">Return to Vaultwork</Button>
      </Link>
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#191F1D',
                border: '1px solid #283530',
                color: '#F4F5F1',
                fontSize: '13px'
              }
            }}
          />

          <Routes>
            <Route element={<AppLayout />}>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/bounties" element={<ExploreBountiesPage />} />
              <Route path="/bounties/:id" element={<BountyDetailPage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected Routes */}
              <Route
                path="/bounties/new"
                element={
                  <ProtectedRoute>
                    <CreateBountyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bounties/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditBountyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <CreatorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-work"
                element={
                  <ProtectedRoute>
                    <DeveloperDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/work/:id"
                element={
                  <ProtectedRoute>
                    <WorkroomPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
