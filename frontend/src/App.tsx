import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Leads, LeadDetail } from '@/pages/Leads'
import { Kanban } from '@/pages/Kanban'
import { NotFound } from '@/pages/NotFound'
import WhatsAppSettings from '@/pages/Settings/WhatsApp'

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="kanban" element={<Kanban />} />
            <Route path="whatsapp" element={<WhatsAppSettings />} />
            <Route path="settings/whatsapp" element={<WhatsAppSettings />} />
            <Route path="settings" element={<div>Configurações - Em breve</div>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}

export default App
