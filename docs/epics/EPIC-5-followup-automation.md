# EPIC-5: Sistema de Follow-up Automático

**Status:** Ready for Development
**Prioridade:** P1 - High Value
**Estimativa:** 5-6 dias
**Owner:** @dev
**Depende de:** EPIC-2, EPIC-4

---

## Objetivo

Implementar o sistema de mensagens automáticas de follow-up, permitindo configurar sequências de mensagens por estágio do Kanban, com suporte a delays, horários permitidos e variáveis dinâmicas.

---

## Escopo

### Incluído
- Configuração de follow-ups por estágio
- Múltiplos follow-ups por estágio (sequência)
- Delay configurável (horas/dias)
- Mensagens de texto e imagem
- Variáveis dinâmicas ({{nome}}, {{empresa}})
- Horário permitido para envio
- Scheduler para processar fila
- Pausar/ativar automação por lead
- Log de mensagens enviadas

### Excluído
- Templates pré-definidos (v2)
- A/B testing de mensagens (v2)
- Condicionais complexas (v2)

---

## User Stories

### Story 5.1: Backend - CRUD de Configurações de Follow-up
**Como** usuário
**Quero** configurar mensagens automáticas por estágio
**Para** fazer follow-up sem esforço manual

**Critérios de Aceite:**
- [ ] `POST /api/followups` - Criar configuração
- [ ] `GET /api/followups` - Listar todas
- [ ] `GET /api/followups/stage/:stageId` - Listar por estágio
- [ ] `PUT /api/followups/:id` - Atualizar
- [ ] `DELETE /api/followups/:id` - Remover
- [ ] `PATCH /api/followups/:id/toggle` - Ativar/desativar
- [ ] `PATCH /api/followups/reorder` - Reordenar sequência
- [ ] Validação de campos obrigatórios

**Modelo:**
```typescript
interface FollowupConfig {
  id: string
  workspace_id: string
  stage_id: string
  name: string
  delay_hours: number
  message_type: 'text' | 'image'
  message_text: string
  media_url?: string
  is_active: boolean
  position: number
  send_start_hour: number  // 0-23
  send_end_hour: number    // 0-23
  created_at: Date
  updated_at: Date
}
```

---

### Story 5.2: Backend - Scheduler de Mensagens
**Como** sistema
**Quero** processar a fila de mensagens agendadas
**Para** enviar follow-ups no momento correto

**Critérios de Aceite:**
- [ ] Cron job rodando a cada minuto
- [ ] Buscar `scheduled_messages` com `scheduled_for <= NOW()`
- [ ] Verificar se lead ainda está no mesmo estágio
- [ ] Verificar se `automation_paused = false`
- [ ] Verificar se está no horário permitido
- [ ] Se fora do horário, reagendar para próximo horário válido
- [ ] Processar variáveis dinâmicas
- [ ] Chamar Evolution API para envio
- [ ] Salvar mensagem em `messages` com `is_automated = true`
- [ ] Atualizar `last_contact_at` do lead
- [ ] Atualizar status da `scheduled_message`
- [ ] Log de erros com retry (max 3)

**Fluxo:**
```
┌─────────────────────────────────────────────────────┐
│                    CRON (1 min)                     │
├─────────────────────────────────────────────────────┤
│ 1. SELECT * FROM scheduled_messages                 │
│    WHERE scheduled_for <= NOW()                     │
│    AND status = 'pending'                           │
│    LIMIT 50                                         │
├─────────────────────────────────────────────────────┤
│ 2. Para cada mensagem:                              │
│    ├─ Lead ainda no estágio? → Se não, SKIP        │
│    ├─ Automation pausada? → Se sim, SKIP           │
│    ├─ Horário permitido? → Se não, RESCHEDULE      │
│    ├─ Processar variáveis ({{nome}}, etc)          │
│    ├─ Enviar via Evolution API                     │
│    ├─ Salvar em messages                           │
│    └─ Marcar scheduled_message como 'sent'         │
├─────────────────────────────────────────────────────┤
│ 3. Se erro: marcar como 'failed', retry_count++    │
│    Se retry_count >= 3: marcar como 'abandoned'    │
└─────────────────────────────────────────────────────┘
```

---

### Story 5.3: Backend - Agendamento Automático
**Como** sistema
**Quero** agendar follow-ups quando lead muda de estágio
**Para** iniciar a sequência automaticamente

**Critérios de Aceite:**
- [ ] Trigger quando lead muda de estágio
- [ ] Cancelar follow-ups pendentes do estágio anterior
- [ ] Buscar follow-ups configurados para novo estágio
- [ ] Criar `scheduled_messages` para cada follow-up
- [ ] Calcular `scheduled_for` baseado no delay
- [ ] Respeitar horário permitido no cálculo
- [ ] Não agendar se `automation_paused = true`
- [ ] Não agendar para estágios finais (is_final = true)

**Cálculo de Agendamento:**
```typescript
function calculateScheduledTime(
  enteredStageAt: Date,
  delayHours: number,
  startHour: number,
  endHour: number
): Date {
  let scheduledFor = addHours(enteredStageAt, delayHours)

  // Se fora do horário, ajustar para próximo horário válido
  const hour = scheduledFor.getHours()
  if (hour < startHour) {
    scheduledFor = setHours(scheduledFor, startHour)
  } else if (hour >= endHour) {
    scheduledFor = setHours(addDays(scheduledFor, 1), startHour)
  }

  return scheduledFor
}
```

---

### Story 5.4: Backend - Variáveis Dinâmicas
**Como** sistema
**Quero** substituir variáveis nas mensagens
**Para** personalizar a comunicação

**Critérios de Aceite:**
- [ ] Suporte a `{{nome}}` - nome do lead
- [ ] Suporte a `{{primeiro_nome}}` - primeiro nome
- [ ] Suporte a `{{empresa}}` - empresa do lead
- [ ] Suporte a `{{telefone}}` - telefone formatado
- [ ] Suporte a `{{email}}` - email
- [ ] Fallback para variáveis vazias (ex: "Cliente")
- [ ] Preservar texto se variável não existir

**Implementação:**
```typescript
function processVariables(text: string, lead: Lead): string {
  const variables = {
    '{{nome}}': lead.name || 'Cliente',
    '{{primeiro_nome}}': lead.name?.split(' ')[0] || 'Cliente',
    '{{empresa}}': lead.company || 'sua empresa',
    '{{telefone}}': formatPhone(lead.phone),
    '{{email}}': lead.email || '',
  }

  let result = text
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(key, value)
  }
  return result
}
```

---

### Story 5.5: Frontend - Página de Configuração de Follow-ups
**Como** usuário
**Quero** configurar as mensagens automáticas
**Para** definir a sequência de follow-up

**Critérios de Aceite:**
- [ ] Página `/settings/followups` criada
- [ ] Dropdown para selecionar estágio
- [ ] Lista de follow-ups configurados para o estágio
- [ ] Drag-and-drop para reordenar
- [ ] Botão "Adicionar Follow-up"
- [ ] Card mostrando: nome, delay, preview da mensagem
- [ ] Toggle ativo/inativo por follow-up
- [ ] Botão editar/excluir

**Layout:**
```
┌────────────────────────────────────────────────────┐
│ Configurar Follow-ups                              │
├────────────────────────────────────────────────────┤
│ Estágio: [Primeiro Contato ▼]                      │
├────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐ │
│ │ ≡ Follow-up 1                        [ON] [⚙] │ │
│ │   Após 1 hora                                  │ │
│ │   "Olá {{nome}}, tudo bem? Vi que..."          │ │
│ └────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────┐ │
│ │ ≡ Follow-up 2                        [ON] [⚙] │ │
│ │   Após 24 horas                                │ │
│ │   "{{nome}}, gostaria de saber se..."          │ │
│ └────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────┐ │
│ │ ≡ Follow-up 3                       [OFF] [⚙] │ │
│ │   Após 72 horas                                │ │
│ │   📷 Imagem + "Última chance..."               │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ [+ Adicionar Follow-up]                            │
└────────────────────────────────────────────────────┘
```

**Componentes:**
- `FollowupsConfigPage`
- `StageSelector`
- `FollowupCard` (draggable)
- `AddFollowupButton`

---

### Story 5.6: Frontend - Modal Criar/Editar Follow-up
**Como** usuário
**Quero** criar e editar mensagens de follow-up
**Para** definir o conteúdo e timing

**Critérios de Aceite:**
- [ ] Modal com formulário
- [ ] Campo: Nome do follow-up
- [ ] Campo: Tempo de espera (número + unidade: horas/dias)
- [ ] Campo: Tipo (texto ou imagem)
- [ ] Campo: Mensagem (textarea com contador)
- [ ] Campo: URL da imagem (se tipo = imagem)
- [ ] Campo: Horário início (dropdown 0-23)
- [ ] Campo: Horário fim (dropdown 0-23)
- [ ] Preview da mensagem com variáveis substituídas
- [ ] Lista de variáveis disponíveis
- [ ] Botão inserir variável no cursor
- [ ] Validação de campos

**Layout:**
```
┌────────────────────────────────────────────────────┐
│ Criar Follow-up                               [X]  │
├────────────────────────────────────────────────────┤
│ Nome: [Follow-up 24h                            ]  │
│                                                    │
│ Enviar após: [24] [horas ▼]                        │
│                                                    │
│ Tipo: (●) Texto  ( ) Imagem                        │
│                                                    │
│ Mensagem:                                          │
│ ┌────────────────────────────────────────────────┐ │
│ │Olá {{nome}}, tudo bem?                         │ │
│ │                                                │ │
│ │Vi que você demonstrou interesse em nosso...   │ │
│ └────────────────────────────────────────────────┘ │
│ 120/500 caracteres                                 │
│                                                    │
│ Variáveis: [{{nome}}] [{{empresa}}] [{{primeiro_nome}}] │
│                                                    │
│ Horário de envio: [08] às [18] horas               │
│                                                    │
│ Preview:                                           │
│ ┌────────────────────────────────────────────────┐ │
│ │ Olá João, tudo bem?                            │ │
│ │ Vi que você demonstrou interesse em nosso...  │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│              [Cancelar]  [Salvar]                  │
└────────────────────────────────────────────────────┘
```

**Componentes:**
- `FollowupFormModal`
- `MessageEditor`
- `VariableButtons`
- `MessagePreview`
- `TimeRangePicker`

---

### Story 5.7: Frontend - Controle de Automação por Lead
**Como** usuário
**Quero** pausar a automação para leads específicos
**Para** evitar envios quando já estou em contato manual

**Critérios de Aceite:**
- [ ] Toggle "Pausar Automação" no detalhe do lead
- [ ] Indicador visual no card do Kanban
- [ ] Pausar cancela mensagens agendadas
- [ ] Reativar reagenda follow-ups pendentes
- [ ] Opção "Pausar até próxima resposta"

**Componente:** `AutomationToggle`

---

### Story 5.8: Backend - Logs e Monitoramento
**Como** admin
**Quero** ver logs das mensagens automáticas
**Para** monitorar e debugar o sistema

**Critérios de Aceite:**
- [ ] `GET /api/followups/logs` - Listar logs
- [ ] Filtro por status (sent, failed, cancelled)
- [ ] Filtro por data
- [ ] Filtro por lead
- [ ] Incluir erro se falhou
- [ ] Paginação

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "lead_name": "João",
      "followup_name": "Follow-up 24h",
      "status": "sent",
      "scheduled_for": "2024-03-28T10:00:00",
      "sent_at": "2024-03-28T10:00:15",
      "error": null
    }
  ],
  "total": 150,
  "page": 1
}
```

---

## Diagrama de Fluxo

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Lead entra  │────▶│ Buscar configs  │────▶│ Criar scheduled  │
│ no estágio  │     │ do estágio      │     │ messages         │
└─────────────┘     └─────────────────┘     └────────┬─────────┘
                                                     │
┌─────────────┐     ┌─────────────────┐              │
│ CRON 1min   │────▶│ Processar fila  │◀─────────────┘
└─────────────┘     └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Validar  │   │Processar │   │  Enviar  │
        │ condições│──▶│ variáveis│──▶│ Evolution│
        └──────────┘   └──────────┘   └────┬─────┘
                                           │
                                    ┌──────▼──────┐
                                    │ Salvar log  │
                                    │ Atualizar   │
                                    │ lead        │
                                    └─────────────┘
```

---

## Definição de Pronto (DoD)

- [ ] Follow-ups configuráveis por estágio
- [ ] Scheduler rodando e enviando mensagens
- [ ] Variáveis sendo substituídas
- [ ] Horário permitido respeitado
- [ ] Pausar/ativar por lead funcionando
- [ ] Logs de envio disponíveis

---

## Quality Gates

- **@qa:** Teste de sequência completa de follow-up
- **@qa:** Teste de horário permitido
- **@qa:** Teste de variáveis dinâmicas
- **CodeRabbit:** Validação de cron job

---

*Epic criado por @pm (Morgan) - Sistema de Acompanhamento de Leads*
