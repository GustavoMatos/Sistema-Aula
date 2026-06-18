import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Kanban, Settings, MessageSquare, LogOut, Building2, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const baseNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['superadmin', 'admin_tenant', 'user_tenant'] },
  { name: 'Leads', href: '/leads', icon: Users, roles: ['superadmin', 'admin_tenant', 'user_tenant'] },
  { name: 'Kanban', href: '/kanban', icon: Kanban, roles: ['superadmin', 'admin_tenant', 'user_tenant'] },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare, roles: ['superadmin', 'admin_tenant'] },
  { name: 'Usuários', href: '/usuarios', icon: Building2, roles: ['superadmin', 'admin_tenant'] },
  { name: 'Assistente IA', href: '/assistente', icon: Bot, roles: ['superadmin', 'admin_tenant', 'user_tenant'] },
  { name: 'Configurações', href: '/settings', icon: Settings, roles: ['superadmin', 'admin_tenant', 'user_tenant'] },
]

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { currentUser } = useCurrentUser()

  const navigation = baseNavigation.filter((item) =>
    !currentUser || item.roles.includes(currentUser.role)
  )

  const handleLogout = async () => {
    await signOut()
    toast.success('Logout realizado com sucesso!')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col">
        <div className="flex h-16 items-center px-6 border-b">
          <h1 className="text-xl font-bold text-primary">Lead Tracker</h1>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User info and logout */}
        <div className="p-4 border-t">
          <div className="mb-3 px-3">
            <p className="text-xs text-muted-foreground">Logado como</p>
            <p className="text-sm font-medium truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
