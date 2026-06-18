import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface InvitationData {
  email: string
  role: string
  tenant_name: string
  expires_at: string
}

export function AcceptInvite() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [success, setSuccess] = useState(false)

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    async function validateToken() {
      try {
        const response = await apiClient.get<{ valid: boolean; invitation: InvitationData }>(`/api/invitations/validate/${token}`)
        setInvitation(response.invitation)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Convite invalido'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      validateToken()
    } else {
      setError('Token de convite nao fornecido')
      setLoading(false)
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('As senhas nao conferem')
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter no minimo 6 caracteres')
      return
    }

    setSubmitting(true)

    try {
      await apiClient.post(`/api/invitations/accept/${token}`, {
        password,
        full_name: fullName || undefined
      })

      setSuccess(true)
      toast.success('Conta criada com sucesso!')

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aceitar convite'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin_tenant':
        return 'Administrador'
      case 'user_tenant':
        return 'Usuario'
      case 'superadmin':
        return 'Super Administrador'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Validando convite...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-xl text-red-600">Convite Invalido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Ir para Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-xl text-green-600">Conta Criada!</CardTitle>
            <CardDescription>
              Sua conta foi criada com sucesso. Redirecionando para o login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">Lead Tracker</CardTitle>
          <CardDescription>
            Voce foi convidado para {invitation?.tenant_name}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <p><strong>Email:</strong> {invitation?.email}</p>
              <p><strong>Empresa:</strong> {invitation?.tenant_name}</p>
              <p><strong>Funcao:</strong> {getRoleLabel(invitation?.role || '')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo (opcional)</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar Minha Conta'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
