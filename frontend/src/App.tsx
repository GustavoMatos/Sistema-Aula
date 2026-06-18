import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Leads, LeadDetail } from '@/pages/Leads'
import { Kanban } from '@/pages/Kanban'
import { NotFound } from '@/pages/NotFound'
import { Login, AcceptInvite, ForgotPassword, ResetPassword } from '@/pages/Auth'
import WhatsAppSettings from '@/pages/Settings/WhatsApp'
import { AdminUsers } from '@/pages/Admin'
import { AgentChat } from '@/pages/Agent'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:id" element={<LeadDetail />} />
              <Route path="kanban" element={<Kanban />} />
              <Route path="whatsapp" element={<WhatsAppSettings />} />
              <Route path="settings/whatsapp" element={<WhatsAppSettings />} />
              <Route path="settings" element={<div>Configuracoes - Em breve</div>} />
              <Route path="usuarios" element={<AdminUsers />} />
              <Route path="assistente" element={<AgentChat />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
