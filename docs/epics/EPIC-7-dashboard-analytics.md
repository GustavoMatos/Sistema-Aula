# EPIC-7: Dashboard & Analytics

**Status:** Ready for Development
**Prioridade:** P2 - Enhancement
**Estimativa:** 3-4 dias
**Owner:** @dev + @ux-design-expert
**Depende de:** EPIC-3, EPIC-4, EPIC-6

---

## Objetivo

Implementar um dashboard com métricas e visualizações para acompanhar a performance do funil de vendas, taxa de conversão e atividade de mensagens.

---

## Escopo

### Incluído
- Dashboard principal com métricas
- Gráfico de funil de conversão
- Métricas por período (dia, semana, mês)
- Status das instâncias WhatsApp
- Leads recentes
- Atividade de mensagens
- Cards de KPIs

### Excluído
- Relatórios exportáveis (v2)
- Comparativo entre períodos (v2)
- Metas e forecasting (v2)
- Dashboards customizáveis (v2)

---

## User Stories

### Story 7.1: Backend - API de Métricas
**Como** frontend
**Quero** endpoints para buscar métricas
**Para** exibir no dashboard

**Critérios de Aceite:**
- [ ] `GET /api/analytics/overview` - Métricas gerais
- [ ] `GET /api/analytics/funnel` - Dados do funil
- [ ] `GET /api/analytics/activity` - Atividade recente
- [ ] Suporte a filtro por período (7d, 30d, 90d)
- [ ] Cache de 5 minutos para queries pesadas
- [ ] Resposta em < 500ms

**Response Overview:**
```json
{
  "period": "30d",
  "total_leads": 245,
  "leads_this_period": 45,
  "leads_change_percent": 15.5,
  "conversion_rate": 12.5,
  "conversion_change_percent": 2.3,
  "messages_sent": 520,
  "messages_received": 312,
  "avg_time_to_conversion": "5.2 dias",
  "leads_by_stage": [
    { "stage": "Novo Lead", "count": 45 },
    { "stage": "Primeiro Contato", "count": 38 },
    ...
  ]
}
```

---

### Story 7.2: Backend - Métricas de Funil
**Como** sistema
**Quero** calcular taxa de conversão entre estágios
**Para** identificar gargalos no pipeline

**Critérios de Aceite:**
- [ ] Calcular % de leads que passam de cada estágio
- [ ] Tempo médio em cada estágio
- [ ] Taxa de abandono por estágio
- [ ] Filtro por período

**Response Funnel:**
```json
{
  "stages": [
    {
      "name": "Novo Lead",
      "count": 100,
      "conversion_to_next": 75.0,
      "avg_time_hours": 24,
      "dropped": 5
    },
    {
      "name": "Primeiro Contato",
      "count": 75,
      "conversion_to_next": 60.0,
      "avg_time_hours": 48,
      "dropped": 10
    },
    ...
  ],
  "total_conversion": 12.5
}
```

---

### Story 7.3: Frontend - Página Dashboard
**Como** usuário
**Quero** ver uma visão geral do meu pipeline
**Para** entender a saúde do negócio

**Critérios de Aceite:**
- [ ] Página `/` ou `/dashboard` como home
- [ ] Layout responsivo com grid
- [ ] Seletor de período (7d, 30d, 90d)
- [ ] Loading states para cada card
- [ ] Refresh automático a cada 5 minutos

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ Dashboard                              Período: [30 dias ▼]│
├────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ │ Total Leads  │ │ Novos Leads  │ │ Conversão    │ │ Msg Enviadas │
│ │     245      │ │     45       │ │   12.5%      │ │     520      │
│ │   ↑ 15.5%    │ │   ↑ 20%      │ │   ↑ 2.3%     │ │   ↑ 10%      │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
├────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────┐ ┌────────────────────────┐
│ │     Funil de Conversão        │ │    WhatsApp Status     │
│ │                               │ │                        │
│ │  ████████████████ 100 (100%) │ │ ● Instância 1: Online  │
│ │  ████████████     75 (75%)   │ │ ● Instância 2: Offline │
│ │  █████████        45 (45%)   │ │                        │
│ │  ██████           30 (30%)   │ │ [Gerenciar]            │
│ │  ███              15 (15%)   │ │                        │
│ │  ██               12 (12%)   │ └────────────────────────┘
│ │                               │
│ └───────────────────────────────┘
├────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────┐ ┌────────────────────────┐
│ │     Leads Recentes            │ │   Atividade Recente    │
│ │                               │ │                        │
│ │ • João - Novo Lead - 2h      │ │ ○ João respondeu       │
│ │ • Maria - Proposta - 3h      │ │ ○ Follow-up enviado    │
│ │ • Pedro - Qualif. - 5h       │ │ ○ Maria moveu estágio  │
│ │ • Ana - Fechado - 1d         │ │ ○ Novo lead: Carlos    │
│ │                               │ │                        │
│ │ [Ver todos]                   │ │ [Ver todos]            │
│ └───────────────────────────────┘ └────────────────────────┘
└────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `DashboardPage`
- `PeriodSelector`
- `MetricCard`
- `FunnelChart`
- `WhatsAppStatusCard`
- `RecentLeadsList`
- `ActivityFeed`

---

### Story 7.4: Frontend - Cards de KPIs
**Como** usuário
**Quero** ver métricas principais em destaque
**Para** acompanhar indicadores chave

**Critérios de Aceite:**
- [ ] Card: Total de Leads
- [ ] Card: Novos Leads (período)
- [ ] Card: Taxa de Conversão
- [ ] Card: Mensagens Enviadas
- [ ] Indicador de variação (↑ ou ↓ + %)
- [ ] Cor verde para positivo, vermelho para negativo
- [ ] Tooltip com detalhes

**Componente:** `MetricCard`

```typescript
interface MetricCardProps {
  title: string
  value: string | number
  change?: number  // percentual
  changeLabel?: string
  icon?: ReactNode
  loading?: boolean
}
```

---

### Story 7.5: Frontend - Gráfico de Funil
**Como** usuário
**Quero** visualizar o funil de conversão
**Para** identificar onde perco leads

**Critérios de Aceite:**
- [ ] Gráfico em formato de funil
- [ ] Cada estágio com cor correspondente
- [ ] Mostrar quantidade e percentual
- [ ] Hover mostra detalhes (tempo médio, abandonos)
- [ ] Click no estágio filtra Kanban
- [ ] Animação ao carregar

**Biblioteca:** recharts ou chart.js

**Componente:** `FunnelChart`

---

### Story 7.6: Frontend - Status das Instâncias
**Como** usuário
**Quero** ver status das conexões WhatsApp
**Para** saber se está tudo funcionando

**Critérios de Aceite:**
- [ ] Lista de instâncias com status
- [ ] Indicador: verde (online), vermelho (offline)
- [ ] Tempo desde última conexão
- [ ] Botão reconectar se offline
- [ ] Link para página de configuração

**Componente:** `WhatsAppStatusCard`

---

### Story 7.7: Frontend - Leads Recentes
**Como** usuário
**Quero** ver os últimos leads
**Para** acompanhar a entrada de novos contatos

**Critérios de Aceite:**
- [ ] Lista dos 5 leads mais recentes
- [ ] Mostrar: nome, estágio, tempo desde criação
- [ ] Click abre detalhe do lead
- [ ] Link "Ver todos" vai para lista de leads

**Componente:** `RecentLeadsList`

---

### Story 7.8: Frontend - Feed de Atividade
**Como** usuário
**Quero** ver atividades recentes
**Para** acompanhar movimentações

**Critérios de Aceite:**
- [ ] Lista das 5 últimas atividades
- [ ] Tipos: mensagem recebida, mensagem enviada, mudança de estágio
- [ ] Ícone por tipo de atividade
- [ ] Tempo relativo (há 5 min, há 1 hora)
- [ ] Atualização em tempo real

**Componente:** `ActivityFeed`

---

## Queries de Métricas

### Total de Leads por Período
```sql
SELECT COUNT(*) as total
FROM leads
WHERE workspace_id = $1
  AND created_at >= NOW() - INTERVAL '30 days'
```

### Taxa de Conversão
```sql
SELECT
  (SELECT COUNT(*) FROM leads WHERE stage_id IN (SELECT id FROM kanban_stages WHERE is_final = true AND name ILIKE '%ganho%'))::float /
  NULLIF((SELECT COUNT(*) FROM leads), 0) * 100 as conversion_rate
```

### Leads por Estágio
```sql
SELECT
  ks.name,
  ks.color,
  COUNT(l.id) as count
FROM kanban_stages ks
LEFT JOIN leads l ON l.stage_id = ks.id
WHERE ks.workspace_id = $1
GROUP BY ks.id
ORDER BY ks.position
```

### Atividade Recente
```sql
SELECT
  lh.action,
  lh.created_at,
  l.name as lead_name,
  ks_from.name as from_stage,
  ks_to.name as to_stage
FROM lead_history lh
JOIN leads l ON l.id = lh.lead_id
LEFT JOIN kanban_stages ks_from ON ks_from.id = lh.from_stage_id
LEFT JOIN kanban_stages ks_to ON ks_to.id = lh.to_stage_id
WHERE l.workspace_id = $1
ORDER BY lh.created_at DESC
LIMIT 10
```

---

## Definição de Pronto (DoD)

- [ ] Dashboard carrega em < 2s
- [ ] Todas as métricas calculando corretamente
- [ ] Gráfico de funil renderizando
- [ ] Status de WhatsApp atualizado
- [ ] Responsivo em tablet
- [ ] Refresh automático funcionando

---

## Quality Gates

- **@ux-design-expert:** Review de UX do dashboard
- **@qa:** Validação de cálculos de métricas
- **@qa:** Teste de performance com muitos dados
- **CodeRabbit:** Otimização de queries SQL

---

*Epic criado por @pm (Morgan) - Sistema de Acompanhamento de Leads*
