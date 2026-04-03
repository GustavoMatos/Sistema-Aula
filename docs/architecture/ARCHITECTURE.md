# Arquitetura do Sistema - Lead Tracking System

**Versão:** 1.0
**Data:** 2026-03-30
**Autor:** @architect (Aria)
**Status:** Approved

---

## 1. Visão Geral da Arquitetura

### 1.1 Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (Browser)                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         React SPA (Vite + TypeScript)                   ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      ││
│  │  │ Kanban   │ │  Leads   │ │Dashboard │ │ Settings │ │  Chat    │      ││
│  │  │  Board   │ │  Central │ │          │ │          │ │  View    │      ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │              State Management (Zustand + React Query)           │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │                    Supabase Client (Auth + Realtime)            │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Node.js + Express)                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                              API Gateway                                 ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      ││
│  │  │  Auth    │ │  CORS    │ │  Rate    │ │  Error   │ │  Logger  │      ││
│  │  │Middleware│ │          │ │ Limiter  │ │ Handler  │ │          │      ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                              Controllers                                 ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      ││
│  │  │  Leads   │ │  Stages  │ │ Messages │ │ WhatsApp │ │ Webhooks │      ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                               Services                                   ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      ││
│  │  │ Evolution│ │Scheduler │ │ Message  │ │ Analytics│ │ Import   │      ││
│  │  │  Service │ │  Service │ │ Service  │ │ Service  │ │ Service  │      ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                           Background Jobs                                ││
│  │  ┌────────────────────────────┐ ┌────────────────────────────┐         ││
│  │  │  Follow-up Scheduler       │ │  Connection Health Check   │         ││
│  │  │  (node-cron - 1min)        │ │  (node-cron - 5min)        │         ││
│  │  └────────────────────────────┘ └────────────────────────────┘         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
          │                                                    │
          │ PostgreSQL                                         │ HTTPS
          ▼                                                    ▼
┌──────────────────────────────────┐        ┌──────────────────────────────────┐
│         SUPABASE                 │        │       EVOLUTION API              │
│  ┌────────────────────────────┐  │        │  ┌────────────────────────────┐  │
│  │       PostgreSQL           │  │        │  │    WhatsApp Baileys        │  │
│  │  ┌──────┐ ┌──────┐        │  │        │  │                            │  │
│  │  │Tables│ │ RLS  │        │  │        │  │  • Create Instance         │  │
│  │  └──────┘ └──────┘        │  │        │  │  • QR Code                 │  │
│  │  ┌──────┐ ┌──────┐        │  │        │  │  • Send Messages           │  │
│  │  │Views │ │Funcs │        │  │        │  │  • Webhooks                │  │
│  │  └──────┘ └──────┘        │  │        │  └────────────────────────────┘  │
│  └────────────────────────────┘  │        └──────────────────────────────────┘
│  ┌────────────────────────────┐  │
│  │       Supabase Auth        │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │     Supabase Realtime      │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### 1.2 Princípios Arquiteturais

| Princípio | Descrição |
|-----------|-----------|
| **Separação de Responsabilidades** | Frontend (UI), Backend (Lógica), Database (Persistência), Evolution (WhatsApp) |
| **API-First** | Backend expõe REST API consumida pelo frontend |
| **Realtime por Padrão** | Supabase Realtime para atualizações instantâneas |
| **Segurança em Camadas** | Auth no Supabase, RLS nas tabelas, validação no backend |
| **Escalabilidade Horizontal** | Backend stateless, pode escalar horizontalmente |
| **Monorepo** | Frontend e backend no mesmo repositório |

---

## 2. Stack Tecnológica

### 2.1 Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 18.x | UI Library |
| **Vite** | 5.x | Build tool e dev server |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 3.x | Styling |
| **shadcn/ui** | latest | Componentes UI |
| **React Router** | 6.x | Roteamento SPA |
| **Zustand** | 4.x | State management global |
| **TanStack Query** | 5.x | Server state e caching |
| **@dnd-kit** | 6.x | Drag and drop (Kanban) |
| **Lucide React** | latest | Ícones |
| **date-fns** | 3.x | Manipulação de datas |
| **Zod** | 3.x | Validação de formulários |
| **React Hook Form** | 7.x | Gerenciamento de forms |

### 2.2 Backend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Node.js** | 20.x LTS | Runtime |
| **Express** | 4.x | Web framework |
| **TypeScript** | 5.x | Type safety |
| **Supabase JS** | 2.x | Database client |
| **Axios** | 1.x | HTTP client (Evolution API) |
| **node-cron** | 3.x | Scheduled jobs |
| **Zod** | 3.x | Validação de input |
| **Winston** | 3.x | Logging |
| **Helmet** | 7.x | Security headers |
| **express-rate-limit** | 7.x | Rate limiting |
| **cors** | 2.x | CORS middleware |
| **dotenv** | 16.x | Environment variables |

### 2.3 Database (Supabase)

| Feature | Propósito |
|---------|-----------|
| **PostgreSQL 17** | Banco de dados principal |
| **Row Level Security** | Isolamento multi-tenant |
| **Supabase Auth** | Autenticação de usuários |
| **Supabase Realtime** | Websockets para updates |
| **Database Functions** | Lógica no banco (triggers) |

### 2.4 Integrações Externas

| Serviço | Propósito |
|---------|-----------|
| **Evolution API** | Gateway WhatsApp |

---

## 3. Arquitetura do Frontend

### 3.1 Estrutura de Pastas

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── kanban/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   ├── KanbanCard.tsx
│   │   │   └── KanbanFilters.tsx
│   │   ├── leads/
│   │   │   ├── LeadForm.tsx
│   │   │   ├── LeadTable.tsx
│   │   │   ├── LeadDetail.tsx
│   │   │   ├── LeadHistory.tsx
│   │   │   └── ImportCSV.tsx
│   │   ├── messages/
│   │   │   ├── MessageHistory.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── MessageComposer.tsx
│   │   ├── whatsapp/
│   │   │   ├── InstanceCard.tsx
│   │   │   ├── QRCodeModal.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── followup/
│   │   │   ├── FollowupConfig.tsx
│   │   │   ├── FollowupCard.tsx
│   │   │   └── FollowupForm.tsx
│   │   └── dashboard/
│   │       ├── MetricCard.tsx
│   │       ├── FunnelChart.tsx
│   │       └── ActivityFeed.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Kanban.tsx
│   │   ├── Leads.tsx
│   │   ├── LeadDetail.tsx
│   │   ├── Settings/
│   │   │   ├── Stages.tsx
│   │   │   ├── Followups.tsx
│   │   │   └── WhatsApp.tsx
│   │   ├── Login.tsx
│   │   └── NotFound.tsx
│   ├── hooks/
│   │   ├── useLeads.ts
│   │   ├── useStages.ts
│   │   ├── useMessages.ts
│   │   ├── useWhatsApp.ts
│   │   ├── useAnalytics.ts
│   │   └── useRealtime.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── kanbanStore.ts
│   │   └── uiStore.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── api.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── types/
│   │   ├── lead.ts
│   │   ├── stage.ts
│   │   ├── message.ts
│   │   ├── followup.ts
│   │   └── api.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── components.json              # shadcn/ui config
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### 3.2 Fluxo de Estado

```
┌─────────────────────────────────────────────────────────────────┐
│                        REACT COMPONENTS                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │    Zustand    │ │ React Query   │ │   Supabase    │
    │  (UI State)   │ │(Server State) │ │  (Realtime)   │
    └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
            │                 │                 │
            │    ┌────────────┘                 │
            │    │                              │
            ▼    ▼                              ▼
    ┌───────────────┐                 ┌───────────────┐
    │   Local UI    │                 │   Supabase    │
    │   Changes     │                 │   Realtime    │
    └───────────────┘                 │   Channel     │
                                      └───────────────┘
```

### 3.3 Padrões de Componentes

```typescript
// Estrutura padrão de componente
// src/components/leads/LeadCard.tsx

import { type FC } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Lead } from '@/types/lead'

interface LeadCardProps {
  lead: Lead
  onClick?: () => void
  isDragging?: boolean
}

export const LeadCard: FC<LeadCardProps> = ({
  lead,
  onClick,
  isDragging = false
}) => {
  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        isDragging && 'opacity-50'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <h3 className="font-medium truncate">{lead.name}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{lead.phone}</p>
        <div className="flex gap-1 mt-2">
          {lead.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 3.4 Hooks Customizados

```typescript
// src/hooks/useLeads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Lead, CreateLeadDTO } from '@/types/lead'

export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => api.leads.list(filters),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLeadDTO) => api.leads.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useMoveLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) =>
      api.leads.moveStage(leadId, stageId),
    onMutate: async ({ leadId, stageId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['kanban'] })
      const previous = queryClient.getQueryData(['kanban'])

      queryClient.setQueryData(['kanban'], (old: any) => {
        // Move lead optimistically
        return moveLeadInKanban(old, leadId, stageId)
      })

      return { previous }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['kanban'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}
```

### 3.5 Realtime Integration

```typescript
// src/hooks/useRealtime.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useLeadsRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          // Invalidate queries to refetch
          queryClient.invalidateQueries({ queryKey: ['leads'] })
          queryClient.invalidateQueries({ queryKey: ['kanban'] })

          // Or update optimistically
          if (payload.eventType === 'INSERT') {
            // Handle new lead
          } else if (payload.eventType === 'UPDATE') {
            // Handle update
          } else if (payload.eventType === 'DELETE') {
            // Handle delete
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
```

---

## 4. Arquitetura do Backend

### 4.1 Estrutura de Pastas

```
backend/
├── src/
│   ├── config/
│   │   ├── index.ts              # Configurações centralizadas
│   │   ├── supabase.ts           # Cliente Supabase
│   │   └── evolution.ts          # Config Evolution API
│   ├── controllers/
│   │   ├── leads.controller.ts
│   │   ├── stages.controller.ts
│   │   ├── messages.controller.ts
│   │   ├── whatsapp.controller.ts
│   │   ├── followups.controller.ts
│   │   ├── webhooks.controller.ts
│   │   └── analytics.controller.ts
│   ├── services/
│   │   ├── leads.service.ts
│   │   ├── stages.service.ts
│   │   ├── messages.service.ts
│   │   ├── followups.service.ts
│   │   ├── analytics.service.ts
│   │   ├── import.service.ts
│   │   ├── evolution/
│   │   │   ├── evolution.service.ts
│   │   │   ├── evolution.types.ts
│   │   │   └── evolution.utils.ts
│   │   └── scheduler/
│   │       ├── scheduler.service.ts
│   │       ├── followup.job.ts
│   │       └── health.job.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validate.middleware.ts
│   │   └── rateLimit.middleware.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── leads.routes.ts
│   │   ├── stages.routes.ts
│   │   ├── messages.routes.ts
│   │   ├── whatsapp.routes.ts
│   │   ├── followups.routes.ts
│   │   ├── webhooks.routes.ts
│   │   └── analytics.routes.ts
│   ├── validators/
│   │   ├── leads.validator.ts
│   │   ├── stages.validator.ts
│   │   ├── followups.validator.ts
│   │   └── common.validator.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── lead.types.ts
│   │   ├── stage.types.ts
│   │   ├── message.types.ts
│   │   ├── followup.types.ts
│   │   └── evolution.types.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   ├── phone.ts
│   │   ├── variables.ts
│   │   └── async.ts
│   ├── app.ts                    # Express app setup
│   └── index.ts                  # Entry point
├── .env.example
├── tsconfig.json
├── nodemon.json
└── package.json
```

### 4.2 Camadas da Aplicação

```
┌─────────────────────────────────────────────────────────────────┐
│                          ROUTES                                  │
│  Define endpoints e conecta com controllers                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                       CONTROLLERS                                │
│  Recebe request, valida, chama service, retorna response         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                        SERVICES                                  │
│  Lógica de negócio, orquestra operações                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │   Supabase    │ │  Evolution    │ │    Utils      │
    │    Client     │ │    Service    │ │   (logger,    │
    │               │ │               │ │   validators) │
    └───────────────┘ └───────────────┘ └───────────────┘
```

### 4.3 Padrão de Controller

```typescript
// src/controllers/leads.controller.ts
import { Request, Response, NextFunction } from 'express'
import { LeadsService } from '@/services/leads.service'
import { CreateLeadDTO, UpdateLeadDTO, LeadFilters } from '@/types/lead.types'
import { AppError } from '@/utils/errors'

export class LeadsController {
  private leadsService: LeadsService

  constructor() {
    this.leadsService = new LeadsService()
  }

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.user!.workspace_id
      const filters: LeadFilters = {
        stage_id: req.query.stage_id as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      }

      const result = await this.leadsService.list(workspaceId, filters)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.user!.workspace_id
      const userId = req.user!.id
      const data: CreateLeadDTO = req.body

      const lead = await this.leadsService.create(workspaceId, userId, data)
      res.status(201).json(lead)
    } catch (error) {
      next(error)
    }
  }

  moveStage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const { stage_id } = req.body
      const userId = req.user!.id

      const lead = await this.leadsService.moveStage(id, stage_id, userId)
      res.json(lead)
    } catch (error) {
      next(error)
    }
  }
}
```

### 4.4 Padrão de Service

```typescript
// src/services/leads.service.ts
import { supabase } from '@/config/supabase'
import { Lead, CreateLeadDTO, UpdateLeadDTO, LeadFilters } from '@/types/lead.types'
import { AppError } from '@/utils/errors'
import { SchedulerService } from './scheduler/scheduler.service'
import { logger } from '@/utils/logger'

export class LeadsService {
  private scheduler: SchedulerService

  constructor() {
    this.scheduler = new SchedulerService()
  }

  async list(workspaceId: string, filters: LeadFilters) {
    let query = supabase
      .from('leads')
      .select('*, kanban_stages(name, color)', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (filters.stage_id) {
      query = query.eq('stage_id', filters.stage_id)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }

    if (filters.tags?.length) {
      query = query.overlaps('tags', filters.tags)
    }

    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      logger.error('Failed to list leads', { error, workspaceId })
      throw new AppError('Failed to list leads', 500)
    }

    return {
      leads: data,
      total: count,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil((count || 0) / filters.limit),
    }
  }

  async create(workspaceId: string, userId: string, data: CreateLeadDTO): Promise<Lead> {
    // Get first stage if not provided
    let stageId = data.stage_id
    if (!stageId) {
      const { data: firstStage } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('workspace_id', workspaceId)
        .order('position', { ascending: true })
        .limit(1)
        .single()

      stageId = firstStage?.id
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        workspace_id: workspaceId,
        stage_id: stageId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        company: data.company,
        source: data.source,
        potential_value: data.potential_value,
        tags: data.tags || [],
        notes: data.notes,
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create lead', { error, data })
      throw new AppError('Failed to create lead', 500)
    }

    // Record history
    await this.recordHistory(lead.id, 'lead_created', userId, {})

    // Schedule followups for the stage
    await this.scheduler.scheduleFollowups(lead.id, stageId)

    return lead
  }

  async moveStage(leadId: string, newStageId: string, userId: string): Promise<Lead> {
    // Get current stage
    const { data: currentLead } = await supabase
      .from('leads')
      .select('stage_id')
      .eq('id', leadId)
      .single()

    const oldStageId = currentLead?.stage_id

    // Update lead
    const { data: lead, error } = await supabase
      .from('leads')
      .update({ stage_id: newStageId, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to move lead', 500)
    }

    // Record history
    await this.recordHistory(leadId, 'stage_change', userId, {
      from_stage_id: oldStageId,
      to_stage_id: newStageId,
    })

    // Cancel old followups and schedule new ones
    await this.scheduler.cancelFollowups(leadId)
    await this.scheduler.scheduleFollowups(leadId, newStageId)

    return lead
  }

  private async recordHistory(
    leadId: string,
    action: string,
    userId: string,
    metadata: Record<string, any>
  ) {
    await supabase.from('lead_history').insert({
      lead_id: leadId,
      action,
      performed_by: userId,
      from_stage_id: metadata.from_stage_id,
      to_stage_id: metadata.to_stage_id,
      metadata,
    })
  }
}
```

### 4.5 Evolution API Service

```typescript
// src/services/evolution/evolution.service.ts
import axios, { AxiosInstance } from 'axios'
import { config } from '@/config'
import {
  CreateInstanceDTO,
  InstanceResponse,
  SendTextDTO,
  SendMediaDTO,
  MessageResponse,
  WebhookConfig
} from './evolution.types'
import { logger } from '@/utils/logger'
import { AppError } from '@/utils/errors'

export class EvolutionService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: config.evolution.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.evolution.apiKey,
      },
      timeout: 30000,
    })
  }

  async createInstance(data: CreateInstanceDTO): Promise<InstanceResponse> {
    try {
      const response = await this.client.post('/instance/create', {
        instanceName: data.instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
        rejectCall: false,
        groupsIgnore: true,
        alwaysOnline: false,
        readMessages: true,
      })

      logger.info('Instance created', { instanceName: data.instanceName })
      return response.data
    } catch (error: any) {
      logger.error('Failed to create instance', { error: error.message })
      throw new AppError('Failed to create WhatsApp instance', 500)
    }
  }

  async getQRCode(instanceName: string): Promise<{ pairingCode: string; code: string }> {
    try {
      const response = await this.client.get(`/instance/connect/${instanceName}`)
      return response.data
    } catch (error: any) {
      logger.error('Failed to get QR code', { error: error.message, instanceName })
      throw new AppError('Failed to get QR code', 500)
    }
  }

  async getConnectionStatus(instanceName: string): Promise<string> {
    try {
      const response = await this.client.get(`/instance/connectionState/${instanceName}`)
      return response.data?.instance?.state || 'unknown'
    } catch (error: any) {
      return 'disconnected'
    }
  }

  async sendText(instanceName: string, data: SendTextDTO): Promise<MessageResponse> {
    try {
      const response = await this.client.post(`/message/sendText/${instanceName}`, {
        number: data.number,
        text: data.text,
        delay: data.delay || 1000,
        linkPreview: true,
      })

      logger.info('Text message sent', { instanceName, number: data.number })
      return response.data
    } catch (error: any) {
      logger.error('Failed to send text', { error: error.message })
      throw new AppError('Failed to send message', 500)
    }
  }

  async sendMedia(instanceName: string, data: SendMediaDTO): Promise<MessageResponse> {
    try {
      const response = await this.client.post(`/message/sendMedia/${instanceName}`, {
        number: data.number,
        mediatype: data.mediaType,
        mimetype: data.mimeType,
        caption: data.caption,
        media: data.mediaUrl,
        fileName: data.fileName,
      })

      logger.info('Media message sent', { instanceName, number: data.number })
      return response.data
    } catch (error: any) {
      logger.error('Failed to send media', { error: error.message })
      throw new AppError('Failed to send media', 500)
    }
  }

  async setWebhook(instanceName: string, webhookUrl: string): Promise<void> {
    try {
      await this.client.post(`/webhook/set/${instanceName}`, {
        url: webhookUrl,
        enabled: true,
        webhookByEvents: true,
        webhookBase64: false,
        events: [
          'MESSAGES_UPSERT',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED',
        ],
      })

      logger.info('Webhook configured', { instanceName, webhookUrl })
    } catch (error: any) {
      logger.error('Failed to set webhook', { error: error.message })
      throw new AppError('Failed to configure webhook', 500)
    }
  }

  async deleteInstance(instanceName: string): Promise<void> {
    try {
      await this.client.delete(`/instance/delete/${instanceName}`)
      logger.info('Instance deleted', { instanceName })
    } catch (error: any) {
      logger.error('Failed to delete instance', { error: error.message })
      throw new AppError('Failed to delete instance', 500)
    }
  }
}
```

### 4.6 Scheduler Service

```typescript
// src/services/scheduler/scheduler.service.ts
import cron from 'node-cron'
import { supabase } from '@/config/supabase'
import { EvolutionService } from '../evolution/evolution.service'
import { processVariables } from '@/utils/variables'
import { logger } from '@/utils/logger'

export class SchedulerService {
  private evolution: EvolutionService

  constructor() {
    this.evolution = new EvolutionService()
  }

  start() {
    // Process follow-up queue every minute
    cron.schedule('* * * * *', () => this.processFollowupQueue())

    // Health check every 5 minutes
    cron.schedule('*/5 * * * *', () => this.checkInstancesHealth())

    logger.info('Scheduler started')
  }

  async scheduleFollowups(leadId: string, stageId: string): Promise<void> {
    const { data: configs } = await supabase
      .from('followup_configs')
      .select('*')
      .eq('stage_id', stageId)
      .eq('is_active', true)
      .order('position')

    if (!configs?.length) return

    const now = new Date()

    for (const config of configs) {
      const scheduledFor = this.calculateScheduledTime(
        now,
        config.delay_hours,
        config.send_start_hour,
        config.send_end_hour
      )

      await supabase.from('scheduled_messages').insert({
        lead_id: leadId,
        followup_config_id: config.id,
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
      })
    }

    logger.info('Followups scheduled', { leadId, count: configs.length })
  }

  async cancelFollowups(leadId: string): Promise<void> {
    await supabase
      .from('scheduled_messages')
      .update({ status: 'cancelled' })
      .eq('lead_id', leadId)
      .eq('status', 'pending')
  }

  private async processFollowupQueue(): Promise<void> {
    const { data: messages } = await supabase
      .from('scheduled_messages')
      .select(`
        *,
        leads(*),
        followup_configs(*),
        leads!inner(
          workspace_id,
          stage_id,
          automation_paused,
          whatsapp_instances(instance_name)
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50)

    if (!messages?.length) return

    for (const message of messages) {
      await this.processScheduledMessage(message)
    }
  }

  private async processScheduledMessage(scheduled: any): Promise<void> {
    const lead = scheduled.leads
    const config = scheduled.followup_configs

    // Skip if automation is paused
    if (lead.automation_paused) {
      await this.updateScheduledStatus(scheduled.id, 'skipped')
      return
    }

    // Skip if lead changed stage
    if (lead.stage_id !== config.stage_id) {
      await this.updateScheduledStatus(scheduled.id, 'skipped')
      return
    }

    // Check if within allowed hours
    const currentHour = new Date().getHours()
    if (currentHour < config.send_start_hour || currentHour >= config.send_end_hour) {
      // Reschedule for next valid window
      await this.rescheduleForNextWindow(scheduled.id, config)
      return
    }

    try {
      const instanceName = lead.whatsapp_instances?.[0]?.instance_name
      if (!instanceName) {
        await this.updateScheduledStatus(scheduled.id, 'failed', 'No WhatsApp instance')
        return
      }

      // Process variables
      const text = processVariables(config.message_text, lead)

      // Send message
      if (config.message_type === 'text') {
        await this.evolution.sendText(instanceName, {
          number: lead.phone,
          text,
        })
      } else if (config.message_type === 'image') {
        await this.evolution.sendMedia(instanceName, {
          number: lead.phone,
          mediaType: 'image',
          mimeType: 'image/png',
          mediaUrl: config.media_url,
          caption: text,
        })
      }

      // Save message record
      await supabase.from('messages').insert({
        lead_id: lead.id,
        instance_id: lead.whatsapp_instances[0].id,
        direction: 'outbound',
        content_type: config.message_type,
        content: text,
        media_url: config.media_url,
        is_automated: true,
        followup_config_id: config.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

      // Update lead
      await supabase
        .from('leads')
        .update({ last_contact_at: new Date().toISOString() })
        .eq('id', lead.id)

      await this.updateScheduledStatus(scheduled.id, 'sent')
      logger.info('Followup sent', { leadId: lead.id, configId: config.id })
    } catch (error: any) {
      logger.error('Failed to send followup', { error: error.message })
      await this.updateScheduledStatus(scheduled.id, 'failed', error.message)
    }
  }

  private calculateScheduledTime(
    baseTime: Date,
    delayHours: number,
    startHour: number,
    endHour: number
  ): Date {
    const scheduled = new Date(baseTime.getTime() + delayHours * 60 * 60 * 1000)
    const hour = scheduled.getHours()

    if (hour < startHour) {
      scheduled.setHours(startHour, 0, 0, 0)
    } else if (hour >= endHour) {
      scheduled.setDate(scheduled.getDate() + 1)
      scheduled.setHours(startHour, 0, 0, 0)
    }

    return scheduled
  }

  private async updateScheduledStatus(
    id: string,
    status: string,
    error?: string
  ): Promise<void> {
    await supabase
      .from('scheduled_messages')
      .update({
        status,
        ...(status === 'sent' && { sent_at: new Date().toISOString() }),
        ...(error && { error }),
      })
      .eq('id', id)
  }

  private async rescheduleForNextWindow(id: string, config: any): Promise<void> {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(config.send_start_hour, 0, 0, 0)

    await supabase
      .from('scheduled_messages')
      .update({ scheduled_for: tomorrow.toISOString() })
      .eq('id', id)
  }

  private async checkInstancesHealth(): Promise<void> {
    const { data: instances } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name')

    if (!instances?.length) return

    for (const instance of instances) {
      const status = await this.evolution.getConnectionStatus(instance.instance_name)
      await supabase
        .from('whatsapp_instances')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', instance.id)
    }
  }
}
```

---

## 5. Arquitetura do Banco de Dados

### 5.1 Diagrama ER Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE SCHEMA                                 │
└─────────────────────────────────────────────────────────────────────────────┘

auth.users (Supabase Auth)
    │
    │ 1:1
    ▼
┌─────────────────┐          ┌─────────────────┐
│     users       │          │   workspaces    │
│─────────────────│          │─────────────────│
│ id (PK, FK)     │─────────▶│ id (PK)         │
│ workspace_id(FK)│          │ name            │
│ email           │          │ settings        │
│ full_name       │          │ created_at      │
│ role            │          └────────┬────────┘
│ created_at      │                   │
└─────────────────┘                   │
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│whatsapp_instances│         │  kanban_stages  │          │     leads       │
│─────────────────│          │─────────────────│          │─────────────────│
│ id (PK)         │          │ id (PK)         │◀─────────│ id (PK)         │
│ workspace_id(FK)│          │ workspace_id(FK)│          │ workspace_id(FK)│
│ instance_name   │          │ name            │          │ stage_id (FK)   │
│ api_key         │          │ color           │          │ name            │
│ api_url         │          │ position        │          │ phone           │
│ status          │          │ is_final        │          │ email           │
│ phone_number    │          │ created_at      │          │ company         │
│ qr_code         │          └─────────────────┘          │ source          │
│ created_at      │                   │                   │ potential_value │
│ updated_at      │                   │                   │ tags[]          │
└────────┬────────┘                   │                   │ notes           │
         │                            │                   │ last_contact_at │
         │                            │                   │automation_paused│
         │                            │                   │ created_at      │
         │                            │                   │ updated_at      │
         │                            │                   └────────┬────────┘
         │                            │                            │
         │                            ▼                            │
         │                   ┌─────────────────┐                   │
         │                   │ followup_configs│                   │
         │                   │─────────────────│                   │
         │                   │ id (PK)         │                   │
         │                   │ workspace_id(FK)│                   │
         │                   │ stage_id (FK)   │                   │
         │                   │ name            │                   │
         │                   │ delay_hours     │                   │
         │                   │ message_type    │                   │
         │                   │ message_text    │                   │
         │                   │ media_url       │                   │
         │                   │ is_active       │                   │
         │                   │ position        │                   │
         │                   │ send_start_hour │                   │
         │                   │ send_end_hour   │                   │
         │                   │ created_at      │                   │
         │                   │ updated_at      │                   │
         │                   └────────┬────────┘                   │
         │                            │                            │
         │              ┌─────────────┼─────────────┐              │
         │              │             │             │              │
         │              ▼             ▼             ▼              │
         │     ┌─────────────┐ ┌───────────────┐                   │
         │     │  messages   │ │scheduled_msgs │                   │
         │     │─────────────│ │───────────────│                   │
         └────▶│ id (PK)     │ │ id (PK)       │                   │
               │ lead_id(FK) │◀│ lead_id (FK)  │◀──────────────────┘
               │instance_id  │ │followup_id(FK)│
               │ direction   │ │ scheduled_for │
               │ content_type│ │ status        │
               │ content     │ │ sent_at       │
               │ media_url   │ │ error         │
               │ status      │ │ created_at    │
               │ whatsapp_id │ └───────────────┘
               │ is_automated│
               │followup_id  │         ┌─────────────────┐
               │ sent_at     │         │  lead_history   │
               │ created_at  │         │─────────────────│
               └─────────────┘         │ id (PK)         │
                                       │ lead_id (FK)    │◀─────────┐
                                       │ action          │          │
                                       │ from_stage_id   │          │
                                       │ to_stage_id     │          │
                                       │ metadata        │          │
                                       │ performed_by    │          │
                                       │ created_at      │          │
                                       └─────────────────┘          │
                                                                    │
                                                                    │
                              (leads.id) ───────────────────────────┘
```

### 5.2 Migrations SQL

```sql
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Instances
CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  instance_name VARCHAR(100) UNIQUE NOT NULL,
  api_key VARCHAR(255),
  api_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting')),
  phone_number VARCHAR(20),
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kanban Stages
CREATE TABLE kanban_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  position INTEGER NOT NULL,
  is_final BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, position)
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES kanban_stages(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  source VARCHAR(100),
  potential_value DECIMAL(12,2),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  last_contact_at TIMESTAMPTZ,
  automation_paused BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-up Configurations
CREATE TABLE followup_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES kanban_stages(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  delay_hours INTEGER NOT NULL CHECK (delay_hours >= 0),
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image')),
  message_text TEXT NOT NULL,
  media_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  position INTEGER NOT NULL,
  send_start_hour INTEGER DEFAULT 8 CHECK (send_start_hour >= 0 AND send_start_hour <= 23),
  send_end_hour INTEGER DEFAULT 18 CHECK (send_end_hour >= 0 AND send_end_hour <= 23),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'document', 'audio', 'video')),
  content TEXT,
  media_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  whatsapp_message_id VARCHAR(100),
  is_automated BOOLEAN DEFAULT FALSE,
  followup_config_id UUID REFERENCES followup_configs(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Messages
CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  followup_config_id UUID NOT NULL REFERENCES followup_configs(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'skipped', 'failed')),
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead History
CREATE TABLE lead_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  from_stage_id UUID REFERENCES kanban_stages(id) ON DELETE SET NULL,
  to_stage_id UUID REFERENCES kanban_stages(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leads_workspace_id ON leads(workspace_id);
CREATE INDEX idx_leads_stage_id ON leads(stage_id);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_last_contact ON leads(last_contact_at DESC);
CREATE INDEX idx_messages_lead_id ON messages(lead_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_scheduled_messages_status ON scheduled_messages(status, scheduled_for);
CREATE INDEX idx_lead_history_lead_id ON lead_history(lead_id);
CREATE INDEX idx_followup_configs_stage ON followup_configs(stage_id, is_active);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_followup_configs_updated_at
  BEFORE UPDATE ON followup_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 5.3 Row Level Security (RLS)

```sql
-- Migration: 002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's workspace
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID AS $$
  SELECT workspace_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Workspaces policies
CREATE POLICY "Users can view their workspace"
  ON workspaces FOR SELECT
  USING (id = get_user_workspace_id());

-- WhatsApp Instances policies
CREATE POLICY "Users can view workspace instances"
  ON whatsapp_instances FOR SELECT
  USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage workspace instances"
  ON whatsapp_instances FOR ALL
  USING (workspace_id = get_user_workspace_id());

-- Kanban Stages policies
CREATE POLICY "Users can view workspace stages"
  ON kanban_stages FOR SELECT
  USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage workspace stages"
  ON kanban_stages FOR ALL
  USING (workspace_id = get_user_workspace_id());

-- Leads policies
CREATE POLICY "Users can view workspace leads"
  ON leads FOR SELECT
  USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage workspace leads"
  ON leads FOR ALL
  USING (workspace_id = get_user_workspace_id());

-- Follow-up Configs policies
CREATE POLICY "Users can view workspace followups"
  ON followup_configs FOR SELECT
  USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage workspace followups"
  ON followup_configs FOR ALL
  USING (workspace_id = get_user_workspace_id());

-- Messages policies
CREATE POLICY "Users can view lead messages"
  ON messages FOR SELECT
  USING (lead_id IN (SELECT id FROM leads WHERE workspace_id = get_user_workspace_id()));

CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE workspace_id = get_user_workspace_id()));

-- Scheduled Messages policies
CREATE POLICY "Users can view scheduled messages"
  ON scheduled_messages FOR SELECT
  USING (lead_id IN (SELECT id FROM leads WHERE workspace_id = get_user_workspace_id()));

-- Lead History policies
CREATE POLICY "Users can view lead history"
  ON lead_history FOR SELECT
  USING (lead_id IN (SELECT id FROM leads WHERE workspace_id = get_user_workspace_id()));
```

### 5.4 Seed Data (Estágios Padrão)

```sql
-- Migration: 003_seed_default_stages.sql

-- Function to create default stages for a workspace
CREATE OR REPLACE FUNCTION create_default_stages(p_workspace_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO kanban_stages (workspace_id, name, color, position, is_final) VALUES
    (p_workspace_id, 'Novo Lead', '#6366f1', 0, false),
    (p_workspace_id, 'Primeiro Contato', '#8b5cf6', 1, false),
    (p_workspace_id, 'Qualificação', '#ec4899', 2, false),
    (p_workspace_id, 'Proposta Enviada', '#f59e0b', 3, false),
    (p_workspace_id, 'Negociação', '#10b981', 4, false),
    (p_workspace_id, 'Fechado Ganho', '#22c55e', 5, true),
    (p_workspace_id, 'Fechado Perdido', '#ef4444', 6, true);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create stages on new workspace
CREATE OR REPLACE FUNCTION on_workspace_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_stages(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_stages_trigger
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION on_workspace_created();
```

---

## 6. API Design

### 6.1 Endpoints Overview

```
BASE URL: /api/v1

Authentication:
  All endpoints require Bearer token (Supabase JWT)
  Header: Authorization: Bearer <token>

┌─────────────────────────────────────────────────────────────────┐
│                         ENDPOINTS                                │
├─────────────────────────────────────────────────────────────────┤
│ LEADS                                                            │
│  POST   /leads              Create lead                          │
│  GET    /leads              List leads (paginated, filtered)     │
│  GET    /leads/:id          Get lead details                     │
│  PUT    /leads/:id          Update lead                          │
│  DELETE /leads/:id          Soft delete lead                     │
│  PATCH  /leads/:id/stage    Move to another stage                │
│  POST   /leads/import       Import from CSV                      │
│  GET    /leads/:id/history  Get lead history                     │
├─────────────────────────────────────────────────────────────────┤
│ KANBAN                                                           │
│  GET    /kanban             Get kanban data (stages + leads)     │
├─────────────────────────────────────────────────────────────────┤
│ STAGES                                                           │
│  POST   /stages             Create stage                         │
│  GET    /stages             List stages                          │
│  PUT    /stages/:id         Update stage                         │
│  DELETE /stages/:id         Delete stage                         │
│  PATCH  /stages/reorder     Reorder stages                       │
├─────────────────────────────────────────────────────────────────┤
│ MESSAGES                                                         │
│  GET    /leads/:id/messages Get lead messages                    │
│  POST   /messages/send      Send message to lead                 │
├─────────────────────────────────────────────────────────────────┤
│ WHATSAPP                                                         │
│  POST   /whatsapp/instances          Create instance             │
│  GET    /whatsapp/instances          List instances              │
│  GET    /whatsapp/instances/:id      Get instance details        │
│  GET    /whatsapp/instances/:id/qr   Get QR code                 │
│  GET    /whatsapp/instances/:id/status  Get connection status    │
│  DELETE /whatsapp/instances/:id      Delete instance             │
│  POST   /whatsapp/instances/:id/logout  Logout instance          │
├─────────────────────────────────────────────────────────────────┤
│ FOLLOWUPS                                                        │
│  POST   /followups          Create followup config               │
│  GET    /followups          List all configs                     │
│  GET    /followups/stage/:id  Get configs for stage              │
│  PUT    /followups/:id      Update config                        │
│  DELETE /followups/:id      Delete config                        │
│  PATCH  /followups/:id/toggle  Toggle active status              │
│  PATCH  /followups/reorder  Reorder configs                      │
├─────────────────────────────────────────────────────────────────┤
│ WEBHOOKS                                                         │
│  POST   /webhooks/evolution  Evolution API webhook               │
├─────────────────────────────────────────────────────────────────┤
│ ANALYTICS                                                        │
│  GET    /analytics/overview  Dashboard metrics                   │
│  GET    /analytics/funnel    Funnel conversion data              │
│  GET    /analytics/activity  Recent activity                     │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Request/Response Examples

#### Create Lead
```http
POST /api/v1/leads
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "João Silva",
  "phone": "5511999999999",
  "email": "joao@email.com",
  "company": "Empresa X",
  "source": "formulário",
  "potential_value": 5000,
  "tags": ["quente", "decisor"],
  "notes": "Interessado no plano anual"
}
```

```json
// Response 201
{
  "id": "uuid",
  "workspace_id": "uuid",
  "stage_id": "uuid",
  "name": "João Silva",
  "phone": "5511999999999",
  "email": "joao@email.com",
  "company": "Empresa X",
  "source": "formulário",
  "potential_value": 5000,
  "tags": ["quente", "decisor"],
  "notes": "Interessado no plano anual",
  "last_contact_at": null,
  "automation_paused": false,
  "created_at": "2024-03-28T10:00:00Z",
  "updated_at": "2024-03-28T10:00:00Z"
}
```

#### Get Kanban
```http
GET /api/v1/kanban?tags=quente
Authorization: Bearer <token>
```

```json
// Response 200
{
  "stages": [
    {
      "id": "uuid",
      "name": "Novo Lead",
      "color": "#6366f1",
      "position": 0,
      "is_final": false,
      "total_leads": 45,
      "leads": [
        {
          "id": "uuid",
          "name": "João Silva",
          "phone": "5511999999999",
          "tags": ["quente"],
          "created_at": "2024-03-28T10:00:00Z",
          "days_in_stage": 2
        }
      ]
    }
  ]
}
```

#### Send Message
```http
POST /api/v1/messages/send
Content-Type: application/json
Authorization: Bearer <token>

{
  "lead_id": "uuid",
  "type": "text",
  "content": "Olá João, tudo bem?"
}
```

```json
// Response 201
{
  "id": "uuid",
  "lead_id": "uuid",
  "direction": "outbound",
  "content_type": "text",
  "content": "Olá João, tudo bem?",
  "status": "sent",
  "whatsapp_message_id": "BAE594145F4C59B4",
  "sent_at": "2024-03-28T10:05:00Z"
}
```

---

## 7. Segurança

### 7.1 Camadas de Segurança

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. NETWORK LAYER                                                │
│     └─ HTTPS only                                                │
│     └─ CORS restricted to frontend domain                       │
│     └─ Rate limiting (100 req/min per IP)                        │
│                                                                  │
│  2. APPLICATION LAYER                                            │
│     └─ Supabase JWT validation                                   │
│     └─ Input validation (Zod schemas)                            │
│     └─ SQL injection prevention (parameterized queries)          │
│     └─ XSS prevention (React escaping)                           │
│                                                                  │
│  3. DATABASE LAYER                                               │
│     └─ Row Level Security (RLS)                                  │
│     └─ Workspace isolation                                       │
│     └─ Encrypted connections (SSL)                               │
│                                                                  │
│  4. EXTERNAL INTEGRATIONS                                        │
│     └─ Evolution API keys stored securely                        │
│     └─ Webhook validation                                        │
│     └─ Secret rotation capability                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Frontend│     │ Backend │     │Supabase │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ 1. Login      │               │               │
     │──────────────▶│               │               │
     │               │ 2. Auth       │               │
     │               │──────────────────────────────▶│
     │               │               │               │
     │               │ 3. JWT Token  │               │
     │               │◀──────────────────────────────│
     │               │               │               │
     │ 4. Store JWT  │               │               │
     │◀──────────────│               │               │
     │               │               │               │
     │ 5. API Call   │               │               │
     │──────────────▶│               │               │
     │               │ 6. + JWT      │               │
     │               │──────────────▶│               │
     │               │               │ 7. Verify JWT │
     │               │               │──────────────▶│
     │               │               │               │
     │               │               │ 8. User Info  │
     │               │               │◀──────────────│
     │               │               │               │
     │               │ 9. Response   │               │
     │               │◀──────────────│               │
     │ 10. Data      │               │               │
     │◀──────────────│               │               │
```

---

## 8. Performance

### 8.1 Estratégias de Otimização

| Área | Estratégia | Implementação |
|------|------------|---------------|
| **Frontend** | Code splitting | React.lazy + Suspense |
| **Frontend** | Caching | React Query (staleTime: 30s) |
| **Frontend** | Virtualização | Para listas longas no Kanban |
| **Backend** | Connection pooling | Supabase client pooler |
| **Backend** | Query optimization | Índices, paginação, select específico |
| **Database** | Índices | Em colunas de filtro/busca |
| **Database** | Particionamento | Não necessário inicialmente |
| **API** | Compressão | gzip via Express |
| **API** | Rate limiting | 100 req/min por IP |

### 8.2 Targets de Performance

| Métrica | Target | Medição |
|---------|--------|---------|
| Kanban load | < 2s | 500 leads |
| Lead create | < 500ms | P95 |
| Message send | < 2s | Inclui Evolution API |
| Dashboard load | < 1s | Com cache |
| First paint | < 1.5s | Lighthouse |

---

## 9. Deployment

### 9.1 Arquitetura de Deploy

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                             │
│  │   Vercel/       │  ◀─── Frontend (React)                     │
│  │   Netlify       │       Static hosting + CDN                 │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │   Railway /     │  ◀─── Backend (Node.js)                    │
│  │   Render        │       Auto-scaling, env vars               │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │   Supabase      │  ◀─── Database + Auth + Realtime           │
│  │   (Managed)     │       Automatic backups                    │
│  └─────────────────┘                                             │
│                                                                  │
│  ┌─────────────────┐                                             │
│  │  Evolution API  │  ◀─── Self-hosted ou Cloud                 │
│  │  (External)     │       Seu servidor ou serviço              │
│  └─────────────────┘                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Variáveis de Ambiente

```env
# Frontend (.env)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_API_URL=https://api.yourdomain.com

# Backend (.env)
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...

# Evolution API
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your-api-key

# App
FRONTEND_URL=https://app.yourdomain.com
WEBHOOK_BASE_URL=https://api.yourdomain.com/api/v1/webhooks

# Security
JWT_SECRET=your-jwt-secret (used by Supabase)
```

---

## 10. Monitoramento

### 10.1 Stack de Observabilidade

| Componente | Ferramenta | Propósito |
|------------|------------|-----------|
| **Logs** | Winston + Logtail/Papertrail | Structured logging |
| **Errors** | Sentry | Error tracking |
| **APM** | Vercel Analytics | Performance |
| **Uptime** | Better Uptime | Health checks |
| **Database** | Supabase Dashboard | Query performance |

### 10.2 Health Checks

```typescript
// GET /health
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-03-28T10:00:00Z",
  "services": {
    "database": "connected",
    "evolution_api": "connected",
    "scheduler": "running"
  }
}
```

---

## 11. Próximos Passos

1. **Criar migrations no Supabase** → EPIC-1, Story 1.4
2. **Setup do projeto React** → EPIC-1, Story 1.2
3. **Setup do projeto Node.js** → EPIC-1, Story 1.3
4. **Implementar Evolution Service** → EPIC-2, Story 2.1
5. **Implementar CRUD de Leads** → EPIC-3, Story 3.1

---

*Arquitetura criada por @architect (Aria) - Sistema de Acompanhamento de Leads*

— Aria, arquitetando o futuro 🏗️
