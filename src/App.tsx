import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider, useAuth } from '@/lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from 'sonner'
import { lazy, Suspense } from 'react'

// Lazy load all pages
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ClientsPage = lazy(() => import('@/pages/ClientsPage'))
const ClientDetailPage = lazy(() => import('@/pages/ClientDetailPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage'))
const FinancePage = lazy(() => import('@/pages/FinancePage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'))
const AdminPanel = lazy(() => import('@/pages/admin/AdminPanel'))

function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <Loading />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { session, loading } = useAuth()
  if (loading) return <Loading />

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/autoservice-pwa">
      <AuthProvider>
        <AppRoutes />
        <Toaster position="bottom-center" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  )
}
