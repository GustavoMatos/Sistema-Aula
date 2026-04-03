import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Send, Phone, Mail, Building2, Tag, Calendar, DollarSign } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LeadFormModal } from '@/components/leads/LeadFormModal'
import { LeadHistoryTimeline } from '@/components/leads/LeadHistoryTimeline'
import { FollowupList } from '@/components/followups/FollowupList'
import { ChatPanel } from '@/components/messages/ChatPanel'
import { useLead, useDeleteLead, useMoveLeadStage } from '@/hooks/useLeads'
import { useKanbanStages } from '@/hooks/useKanbanStages'

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const ddd = cleaned.slice(2, 4)
    const firstPart = cleaned.slice(4, 9)
    const secondPart = cleaned.slice(9)
    return `(${ddd}) ${firstPart}-${secondPart}`
  }
  if (cleaned.length === 11) {
    const ddd = cleaned.slice(0, 2)
    const firstPart = cleaned.slice(2, 7)
    const secondPart = cleaned.slice(7)
    return `(${ddd}) ${firstPart}-${secondPart}`
  }
  return phone
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const { data: lead, isLoading, error } = useLead(id!)
  const { data: stages } = useKanbanStages()
  const deleteLead = useDeleteLead()
  const moveStage = useMoveLeadStage()

  const handleDelete = async () => {
    await deleteLead.mutateAsync(id!)
    navigate('/leads')
  }

  const handleStageChange = (stageId: string) => {
    moveStage.mutate({ id: id!, stageId })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">Erro ao carregar lead</p>
        <Button variant="outline" onClick={() => navigate('/leads')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Leads
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
            <p className="text-gray-500">
              Criado {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir lead</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir {lead.name}? Esta acao nao pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Lead Info Card */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Informacoes do Lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{formatPhone(lead.phone)}</p>
                </div>
              </div>

              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{lead.email}</p>
                  </div>
                </div>
              )}

              {lead.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Empresa</p>
                    <p className="font-medium">{lead.company}</p>
                  </div>
                </div>
              )}

              {lead.source && (
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Origem</p>
                    <p className="font-medium capitalize">{lead.source}</p>
                  </div>
                </div>
              )}

              {lead.potential_value && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Valor Potencial</p>
                    <p className="font-medium">{formatCurrency(lead.potential_value)}</p>
                  </div>
                </div>
              )}

              {lead.last_contact_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Ultima Interacao</p>
                    <p className="font-medium">
                      {format(new Date(lead.last_contact_at), "dd 'de' MMMM 'as' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {lead.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Observacoes</p>
                <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}

            {lead.tags && lead.tags.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stage & Actions Card */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estagio Atual</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.kanban_stages && (
                <Badge
                  variant="outline"
                  className="mb-4 text-base py-2 px-4"
                  style={{
                    borderColor: lead.kanban_stages.color,
                    color: lead.kanban_stages.color,
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: lead.kanban_stages.color }}
                  />
                  {lead.kanban_stages.name}
                </Badge>
              )}

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Mover para:</p>
                <Select value={lead.stage_id} onValueChange={handleStageChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages?.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acoes Rapidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Enviar WhatsApp
              </Button>
              <Button className="w-full" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Ligar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat and Follow-ups */}
      <div className="grid grid-cols-2 gap-6">
        {/* WhatsApp Chat */}
        <Card>
          <CardHeader>
            <CardTitle>Conversa WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <ChatPanel
              leadId={id!}
              leadName={lead.name}
              leadPhone={lead.phone}
            />
          </CardContent>
        </Card>

        {/* Follow-ups */}
        <Card>
          <CardHeader>
            <CardTitle>Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <FollowupList leadId={id!} />
          </CardContent>
        </Card>
      </div>

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Historico de Interacoes</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadHistoryTimeline leadId={id!} />
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <LeadFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        lead={lead}
      />
    </div>
  )
}
