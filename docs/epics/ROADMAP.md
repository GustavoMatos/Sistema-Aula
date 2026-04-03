# Roadmap - Sistema de Acompanhamento de Leads

**Projeto:** Lead Tracking System
**Data:** 2026-03-30
**Stack:** React + Node.js + Supabase + Evolution API

---

## Visão Geral dos Épicos

| Epic | Nome | Prioridade | Estimativa | Dependências |
|------|------|------------|------------|--------------|
| [EPIC-1](./EPIC-1-setup-infraestrutura.md) | Setup & Infraestrutura | P0 | 3-4 dias | - |
| [EPIC-2](./EPIC-2-whatsapp-integration.md) | Integração WhatsApp | P0 | 4-5 dias | EPIC-1 |
| [EPIC-3](./EPIC-3-central-leads.md) | Central de Leads | P0 | 4-5 dias | EPIC-1 |
| [EPIC-4](./EPIC-4-kanban-board.md) | Kanban Board | P0 | 5-6 dias | EPIC-1, EPIC-3 |
| [EPIC-5](./EPIC-5-followup-automation.md) | Follow-up Automático | P1 | 5-6 dias | EPIC-2, EPIC-4 |
| [EPIC-6](./EPIC-6-webhooks-realtime.md) | Webhooks & Realtime | P1 | 3-4 dias | EPIC-2, EPIC-3 |
| [EPIC-7](./EPIC-7-dashboard-analytics.md) | Dashboard & Analytics | P2 | 3-4 dias | EPIC-3, EPIC-4, EPIC-6 |

**Total Estimado:** 27-34 dias de desenvolvimento

---

## Diagrama de Dependências

```
                    ┌─────────────────┐
                    │    EPIC-1       │
                    │ Setup & Infra   │
                    │    (3-4 dias)   │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 │
    ┌─────────────┐   ┌─────────────┐         │
    │   EPIC-2    │   │   EPIC-3    │         │
    │  WhatsApp   │   │   Leads     │         │
    │  (4-5 dias) │   │  (4-5 dias) │         │
    └──────┬──────┘   └──────┬──────┘         │
           │                 │                 │
           │    ┌────────────┤                 │
           │    │            │                 │
           │    ▼            ▼                 │
           │  ┌─────────────────┐              │
           │  │    EPIC-4       │◀─────────────┘
           │  │    Kanban       │
           │  │   (5-6 dias)    │
           │  └────────┬────────┘
           │           │
    ┌──────┴───────────┼───────────┐
    │                  │           │
    ▼                  ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   EPIC-5    │ │   EPIC-6    │ │   EPIC-7    │
│  Follow-up  │ │  Webhooks   │ │  Dashboard  │
│  (5-6 dias) │ │  (3-4 dias) │ │  (3-4 dias) │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## Fases de Entrega

### Fase 1: MVP Foundation (Semanas 1-2)
**Objetivo:** Sistema funcional básico

| Epic | Stories Incluídas | Entregável |
|------|-------------------|------------|
| EPIC-1 | Todas (1.1-1.5) | Projeto configurado, banco criado |
| EPIC-3 | 3.1-3.6 (sem import CSV) | CRUD de leads funcionando |
| EPIC-2 | 2.1-2.5 | Conexão WhatsApp via QR Code |

**Checkpoint:** Usuário consegue criar leads e conectar WhatsApp

---

### Fase 2: Kanban & Messaging (Semanas 2-3)
**Objetivo:** Visualização e comunicação

| Epic | Stories Incluídas | Entregável |
|------|-------------------|------------|
| EPIC-4 | 4.1-4.6 (sem realtime) | Kanban com drag-and-drop |
| EPIC-2 | 2.6-2.7 | Envio de mensagens manual |
| EPIC-6 | 6.1-6.4 | Recebimento de mensagens |

**Checkpoint:** Usuário consegue mover leads no Kanban e trocar mensagens

---

### Fase 3: Automation (Semanas 3-4)
**Objetivo:** Follow-up automático funcionando

| Epic | Stories Incluídas | Entregável |
|------|-------------------|------------|
| EPIC-5 | Todas (5.1-5.8) | Sistema de automação completo |
| EPIC-4 | 4.7-4.8 | Filtros e Realtime |
| EPIC-6 | 6.5-6.8 | Auto-create leads, notificações |

**Checkpoint:** Sistema enviando follow-ups automaticamente

---

### Fase 4: Polish & Analytics (Semana 4-5)
**Objetivo:** Dashboard e refinamentos

| Epic | Stories Incluídas | Entregável |
|------|-------------------|------------|
| EPIC-7 | Todas (7.1-7.8) | Dashboard com métricas |
| EPIC-3 | 3.7 | Import CSV |
| - | Bug fixes, UX polish | Sistema refinado |

**Checkpoint:** Sistema completo e polido

---

## Cronograma Sugerido

```
Semana 1: |████████████████████████████████████████| EPIC-1 + EPIC-3
Semana 2: |████████████████████████████████████████| EPIC-2 + EPIC-4 (início)
Semana 3: |████████████████████████████████████████| EPIC-4 (fim) + EPIC-6
Semana 4: |████████████████████████████████████████| EPIC-5
Semana 5: |████████████████████████████████████████| EPIC-7 + Polish
```

---

## Métricas de Sucesso

### MVP (Fase 1-2)
- [ ] Leads podem ser criados e visualizados
- [ ] WhatsApp conecta via QR Code
- [ ] Mensagens podem ser enviadas
- [ ] Kanban funciona com drag-and-drop

### Completo (Fase 3-4)
- [ ] Follow-ups são enviados automaticamente
- [ ] Mensagens recebidas aparecem no histórico
- [ ] Dashboard mostra métricas corretas
- [ ] Sistema funciona em tempo real

---

## Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Evolution API instável | Alto | Média | Retry logic, fallback UI |
| Performance com muitos leads | Médio | Baixa | Paginação, virtualização |
| Complexidade do drag-and-drop | Médio | Média | Usar @dnd-kit, testes intensivos |
| Ban do WhatsApp | Alto | Baixa | Rate limiting, delays |

---

## Recursos Necessários

### Técnicos
- [x] Projeto Supabase (AIOXSUPABASE)
- [ ] Servidor Evolution API
- [ ] Domínio para webhook (HTTPS)

### Humanos
- 1 Desenvolvedor Full Stack
- Acesso ao @dev, @qa, @devops do AIOX

---

## Próximos Passos Imediatos

1. **Inicializar projeto** → EPIC-1, Story 1.1
2. **Criar migrations** → EPIC-1, Story 1.4
3. **Setup frontend React** → EPIC-1, Story 1.2
4. **Setup backend Node** → EPIC-1, Story 1.3

---

*Roadmap criado por @pm (Morgan) - Sistema de Acompanhamento de Leads*
