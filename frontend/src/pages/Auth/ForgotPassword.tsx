import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { AnimatedBackground } from '@/components/auth/AnimatedBackground'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Preencha o email')
      return
    }

    setLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      toast.error('Erro ao enviar email: ' + error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-awa-navy px-4 relative overflow-hidden">
        <AnimatedBackground />
        <Card className="w-full max-w-md relative z-10 shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img src="/brand/logo-horizontal.svg" alt="A.W.A Capital" className="h-12" />
            </div>
            <CardTitle className="text-lg font-semibold text-awa-navy">Email enviado</CardTitle>
            <CardDescription>
              Enviamos um link de recuperação para <strong>{email}</strong>.
              Verifique sua caixa de entrada e spam.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link to="/login" className="text-sm text-awa-gold hover:underline font-medium">
              Voltar ao login
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-awa-navy px-4 relative overflow-hidden">
      <AnimatedBackground />
      <Card className="w-full max-w-md relative z-10 shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <img src="/brand/logo-horizontal.svg" alt="A.W.A Capital" className="h-12" />
          </div>
          <CardTitle className="text-lg font-semibold text-awa-navy">Esqueci minha senha</CardTitle>
          <CardDescription>
            Digite seu email e enviaremos um link para redefinir sua senha.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-awa-navy hover:bg-awa-navy/90" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>
            <Link to="/login" className="text-sm text-awa-gold hover:underline font-medium">
              Voltar ao login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
