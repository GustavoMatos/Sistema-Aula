import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, Building2, Mail, Shield, ToggleLeft, ToggleRight, Trash2, ChevronDown, ChevronRight, Copy, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { usersApi, type UserListItem, type InvitationItem } from '@/lib/api/users'
import { tenantsApi, type Tenant } from '@/lib/api/tenants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ─── Role badge ────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; className: string }> = {
    superadmin: { label: 'Super Admin', className: 'bg-purple-100 text-purple-800' },
    admin_tenant: { label: 'Admin', className: 'bg-blue-100 text-blue-800' },
    user_tenant: { label: 'Usuário', className: 'bg-gray-100 text-gray-700' },
  }
  const cfg = map[role] ?? { label: role, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', cfg.className)}>
      {cfg.label}
    </span>
  )
}

// ─── Status badge ──────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
    )}>
      {active ? 'Ativo' : 'Inativo'}
    </span>
  )
}

// ─── Copy button (for invite URLs) ─────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

// ─── Plan label ────────────────────────────────────────────────────────────
const planLabels: Record<string, string> = { free: 'Gratuito', basic: 'Básico', pro: 'Pro' }

// ═══════════════════════════════════════════════════════════════════════════
// SUPERADMIN VIEW
// ═══════════════════════════════════════════════════════════════════════════

function SuperadminView() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null)
  const [form, setForm] = useState({
    tenant_name: '',
    tenant_plan: 'free' as 'free' | 'basic' | 'pro',
    tenant_max_users: '5',
    admin_full_name: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirm: '',
  })

  const { data: tenantsData, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.list(),
  })

  const { data: expandedData, isLoading: expandedLoading } = useQuery({
    queryKey: ['tenant', expandedTenant],
    queryFn: () => tenantsApi.getById(expandedTenant!),
    enabled: !!expandedTenant,
  })

  const createMutation = useMutation({
    mutationFn: tenantsApi.createWithAdmin,
    onSuccess: () => {
      toast.success('Empresa e administrador criados com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setCreateOpen(false)
      setForm({
        tenant_name: '',
        tenant_plan: 'free',
        tenant_max_users: '5',
        admin_full_name: '',
        admin_email: '',
        admin_password: '',
        admin_password_confirm: '',
      })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleTenantMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      tenantsApi.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
    onError: (err: Error) => toast.error(err.message),
  })

  const handleCreate = () => {
    if (form.admin_password !== form.admin_password_confirm) {
      toast.error('As senhas não coincidem')
      return
    }
    createMutation.mutate({
      tenant_name: form.tenant_name,
      tenant_plan: form.tenant_plan,
      tenant_max_users: Number(form.tenant_max_users),
      admin_email: form.admin_email,
      admin_password: form.admin_password,
      admin_full_name: form.admin_full_name || undefined,
    })
  }

  const tenants: Tenant[] = tenantsData?.tenants ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Empresas e Usuários</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie todas as empresas e seus administradores
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Building2 className="h-4 w-4" />
            Empresas
          </div>
          <p className="text-2xl font-bold">{tenants.length}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Users className="h-4 w-4" />
            Total de Usuários
          </div>
          <p className="text-2xl font-bold">
            {tenants.reduce((sum, t) => sum + (t.user_count ?? 0), 0)}
          </p>
        </div>
      </div>

      {/* Tenants list */}
      <div className="border rounded-lg overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma empresa cadastrada
          </div>
        ) : (
          <div className="divide-y">
            {tenants.map((tenant) => (
              <div key={tenant.id}>
                {/* Tenant row */}
                <div
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer"
                  onClick={() =>
                    setExpandedTenant(expandedTenant === tenant.id ? null : tenant.id)
                  }
                >
                  <div className="text-muted-foreground">
                    {expandedTenant === tenant.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                  </div>
                  <Badge variant="outline">{planLabels[tenant.plan] ?? tenant.plan}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {tenant.user_count ?? 0}/{tenant.max_users} usuários
                  </span>
                  <StatusBadge active={tenant.is_active} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTenantMutation.mutate({ id: tenant.id, is_active: !tenant.is_active })
                    }}
                  >
                    {tenant.is_active ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {/* Expanded users */}
                {expandedTenant === tenant.id && (
                  <div className="bg-muted/20 border-t px-8 py-3">
                    {expandedLoading ? (
                      <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                    ) : expandedData?.tenant.users.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum usuário nesta empresa</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground text-xs border-b">
                            <th className="text-left py-2 pr-4 font-medium">Nome</th>
                            <th className="text-left py-2 pr-4 font-medium">Email</th>
                            <th className="text-left py-2 pr-4 font-medium">Role</th>
                            <th className="text-left py-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {expandedData?.tenant.users.map((u) => (
                            <tr key={u.id}>
                              <td className="py-2 pr-4">{u.full_name || '—'}</td>
                              <td className="py-2 pr-4 text-muted-foreground">{u.email}</td>
                              <td className="py-2 pr-4">
                                <RoleBadge role={u.role} />
                              </td>
                              <td className="py-2">
                                <StatusBadge active={u.is_active} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Empresa e Administrador</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Tenant section */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Dados da Empresa
              </p>
              <div className="space-y-3">
                <div>
                  <Label>Nome da Empresa *</Label>
                  <Input
                    className="mt-1"
                    placeholder="Ex: Acme Ltda"
                    value={form.tenant_name}
                    onChange={(e) => setForm((f) => ({ ...f, tenant_name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Plano</Label>
                    <Select
                      value={form.tenant_plan}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, tenant_plan: v as 'free' | 'basic' | 'pro' }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Gratuito</SelectItem>
                        <SelectItem value="basic">Básico</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Máx. Usuários</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      min="1"
                      value={form.tenant_max_users}
                      onChange={(e) => setForm((f) => ({ ...f, tenant_max_users: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Admin section */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> Administrador da Empresa
              </p>
              <div className="space-y-3">
                <div>
                  <Label>Nome Completo</Label>
                  <Input
                    className="mt-1"
                    placeholder="João Silva"
                    value={form.admin_full_name}
                    onChange={(e) => setForm((f) => ({ ...f, admin_full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    className="mt-1"
                    type="email"
                    placeholder="admin@empresa.com"
                    value={form.admin_email}
                    onChange={(e) => setForm((f) => ({ ...f, admin_email: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Senha *</Label>
                    <Input
                      className="mt-1"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={form.admin_password}
                      onChange={(e) => setForm((f) => ({ ...f, admin_password: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Confirmar Senha *</Label>
                    <Input
                      className="mt-1"
                      type="password"
                      placeholder="Repita a senha"
                      value={form.admin_password_confirm}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, admin_password_confirm: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Criando...' : 'Criar Empresa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN TENANT VIEW
// ═══════════════════════════════════════════════════════════════════════════

function AdminTenantView() {
  const queryClient = useQueryClient()
  const { currentUser } = useCurrentUser()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users')

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  })

  const { data: invitationsData, isLoading: invitationsLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => usersApi.listInvitations(),
    enabled: activeTab === 'invitations',
  })

  const inviteMutation = useMutation({
    mutationFn: (email: string) =>
      usersApi.invite({ email, role: 'user_tenant', tenant_id: currentUser?.tenant?.id }),
    onSuccess: (data) => {
      toast.success('Convite criado com sucesso!')
      setInviteUrl(data.invitation.invite_url)
      setInviteEmail('')
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleUserMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      usersApi.update(id, { is_active }),
    onSuccess: () => {
      toast.success('Usuário atualizado')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const cancelInviteMutation = useMutation({
    mutationFn: (id: string) => usersApi.cancelInvitation(id),
    onSuccess: () => {
      toast.success('Convite cancelado')
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const resendInviteMutation = useMutation({
    mutationFn: (id: string) => usersApi.resendInvitation(id),
    onSuccess: () => toast.success('Email de convite reenviado!'),
    onError: (err: Error) => toast.error(err.message),
  })

  const users: UserListItem[] = usersData?.users ?? []
  const invitations: InvitationItem[] = invitationsData?.invitations ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie os usuários da sua empresa
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Mail className="h-4 w-4 mr-2" />
          Convidar Usuário
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['users', 'invitations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'users' ? `Usuários (${users.length})` : 'Convites'}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="border rounded-lg overflow-hidden bg-card">
          {usersLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum usuário cadastrado
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">{u.full_name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={u.is_active} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* Admin can only toggle user_tenant */}
                      {u.role === 'user_tenant' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={u.is_active ? 'Desativar usuário' : 'Ativar usuário'}
                          onClick={() =>
                            toggleUserMutation.mutate({ id: u.id, is_active: !u.is_active })
                          }
                        >
                          {u.is_active ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Invitations tab */}
      {activeTab === 'invitations' && (
        <div className="border rounded-lg overflow-hidden bg-card">
          {invitationsLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : invitations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum convite enviado
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expira em</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">{inv.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={inv.role} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        inv.status === 'accepted' && 'bg-green-100 text-green-800',
                        inv.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                        inv.status === 'expired' && 'bg-gray-100 text-gray-600',
                      )}>
                        {inv.status === 'accepted' ? 'Aceito' : inv.status === 'pending' ? 'Pendente' : 'Expirado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-700"
                            title="Reenviar email do convite"
                            onClick={() => resendInviteMutation.mutate(inv.id)}
                            disabled={resendInviteMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            title="Cancelar convite"
                            onClick={() => cancelInviteMutation.mutate(inv.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) setInviteUrl(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Usuário</DialogTitle>
          </DialogHeader>

          {inviteUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Convite criado! Envie o link abaixo para o usuário:
              </p>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <p className="text-xs flex-1 break-all font-mono">{inviteUrl}</p>
                <CopyButton text={inviteUrl} />
              </div>
              <p className="text-xs text-muted-foreground">
                O link expira em 7 dias.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <Label>Email do usuário *</Label>
                <Input
                  className="mt-1"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O usuário receberá um link para criar sua senha e acessar o sistema.
              </p>
            </div>
          )}

          <DialogFooter>
            {inviteUrl ? (
              <Button onClick={() => { setInviteOpen(false); setInviteUrl(null) }}>
                Fechar
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => inviteMutation.mutate(inviteEmail)}
                  disabled={!inviteEmail || inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export function AdminUsers() {
  const { currentUser, isLoading, error, isSuperadmin, isAdminTenant } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
        <p className="text-red-500 font-medium">Erro ao carregar perfil</p>
        <p className="text-sm">{error?.message ?? 'Usuário não encontrado'}</p>
      </div>
    )
  }

  if (isSuperadmin) return <SuperadminView />
  if (isAdminTenant) return <AdminTenantView />

  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Você não tem permissão para acessar esta página.
    </div>
  )
}
