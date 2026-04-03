# EPIC-4: Kanban Board

**Status:** Ready for Development
**Prioridade:** P0 - Critical Path
**Estimativa:** 5-6 dias
**Owner:** @dev + @ux-design-expert
**Depende de:** EPIC-1, EPIC-3

---

## Objetivo

Implementar a visualização Kanban completa com drag-and-drop, configuração de estágios customizáveis e atualização em tempo real via Supabase Realtime.

---

## Escopo

### Incluído
- Visualização Kanban com colunas
- Drag-and-drop entre estágios
- CRUD de estágios (customização)
- Reordenação de estágios
- Cards de lead com informações resumidas
- Filtros no Kanban
- Realtime updates

### Excluído
- Swimlanes (v2)
- Múltiplos Kanbans por workspace (v2)
- Automação ao mover (Epic 5)

---

## User Stories

### Story 4.1: Backend - CRUD de Estágios
**Como** usuário
**Quero** criar e customizar os estágios do Kanban
**Para** adaptar o pipeline ao meu processo

**Critérios de Aceite:**
- [ ] `POST /api/stages` - Criar estágio
- [ ] `GET /api/stages` - Listar estágios (ordenado por position)
- [ ] `PUT /api/stages/:id` - Atualizar estágio
- [ ] `DELETE /api/stages/:id` - Remover estágio
- [ ] `PATCH /api/stages/reorder` - Reordenar estágios
- [ ] Validar que não pode deletar estágio com leads (ou mover leads)
- [ ] Seed de estágios padrão para novos workspaces

**Estágios Padrão (Seed):**
```javascript
const defaultStages = [
  { name: 'Novo Lead', color: '#6366f1', position: 0 },
  { name: 'Primeiro Contato', color: '#8b5cf6', position: 1 },
  { name: 'Qualificação', color: '#ec4899', position: 2 },
  { name: 'Proposta Enviada', color: '#f59e0b', position: 3 },
  { name: 'Negociação', color: '#10b981', position: 4 },
  { name: 'Fechado Ganho', color: '#22c55e', position: 5, is_final: true },
  { name: 'Fechado Perdido', color: '#ef4444', position: 6, is_final: true },
]
```

---

### Story 4.2: Backend - API para Kanban
**Como** frontend
**Quero** buscar dados otimizados para o Kanban
**Para** carregar rapidamente com muitos leads

**Critérios de Aceite:**
- [ ] `GET /api/kanban` - Retorna estágios com leads agrupados
- [ ] Limitar leads por estágio (ex: 50 mais recentes)
- [ ] Incluir contagem total por estágio
- [ ] Suporte a filtros (tags, source)
- [ ] Response otimizado (sem dados desnecessários)

**Response:**
```json
{
  "stages": [
    {
      "id": "uuid",
      "name": "Novo Lead",
      "color": "#6366f1",
      "position": 0,
      "total_leads": 45,
      "leads": [
        {
          "id": "uuid",
          "name": "João",
          "phone": "11999999999",
          "tags": ["Quente"],
          "created_at": "2024-03-28",
          "days_in_stage": 3
        }
      ]
    }
  ]
}
```

---

### Story 4.3: Frontend - Componente Kanban Board
**Como** usuário
**Quero** ver meus leads em formato de Kanban
**Para** visualizar o pipeline de vendas

**Critérios de Aceite:**
- [ ] Página `/kanban` criada
- [ ] Colunas para cada estágio
- [ ] Header da coluna com nome, cor e contagem
- [ ] Cards de lead em cada coluna
- [ ] Scroll horizontal entre colunas (mobile)
- [ ] Scroll vertical dentro da coluna
- [ ] Loading state ao carregar
- [ ] Empty state por coluna

**Componentes:**
- `KanbanPage`
- `KanbanBoard`
- `KanbanColumn`
- `KanbanCard`

**Bibliotecas:**
- `@dnd-kit/core` para drag-and-drop

---

### Story 4.4: Frontend - Drag and Drop
**Como** usuário
**Quero** arrastar leads entre estágios
**Para** atualizar o status rapidamente

**Critérios de Aceite:**
- [ ] Arrastar card de uma coluna para outra
- [ ] Visual feedback durante arraste (sombra, highlight)
- [ ] Drop zone destacada ao passar sobre coluna
- [ ] Atualização otimista (move antes de confirmar API)
- [ ] Rollback se API falhar
- [ ] Animação suave ao mover
- [ ] Touch support para tablet

**Fluxo:**
```
1. Usuário inicia arraste do card
2. Card "levanta" com sombra
3. Colunas mostram drop zone
4. Usuário solta na coluna destino
5. Card move instantaneamente (otimista)
6. API chamada em background
7. Se erro, card volta ao original + toast
```

---

### Story 4.5: Frontend - Card do Lead no Kanban
**Como** usuário
**Quero** ver informações resumidas no card
**Para** identificar leads rapidamente

**Critérios de Aceite:**
- [ ] Nome do lead (truncado se longo)
- [ ] Telefone formatado
- [ ] Tags (máximo 2, +N se mais)
- [ ] Tempo no estágio (ex: "há 3 dias")
- [ ] Indicador se automação pausada
- [ ] Click abre detalhes do lead
- [ ] Hover mostra ações rápidas (ver, mover)

**Design do Card:**
```
┌─────────────────────────┐
│ João da Silva           │
│ (11) 99999-9999         │
│ [Quente] [Decisor]      │
│ há 3 dias        🔵     │
└─────────────────────────┘
```

**Componente:** `KanbanCard`

---

### Story 4.6: Frontend - Configuração de Estágios
**Como** usuário
**Quero** customizar os estágios do Kanban
**Para** adaptar ao meu processo de vendas

**Critérios de Aceite:**
- [ ] Página `/settings/stages` ou modal
- [ ] Lista de estágios com drag-and-drop para reordenar
- [ ] Editar nome e cor de cada estágio
- [ ] Adicionar novo estágio
- [ ] Remover estágio (com aviso se tiver leads)
- [ ] Marcar estágio como "Final" (Ganho/Perdido)
- [ ] Color picker para cor do estágio
- [ ] Salvar alterações

**Componentes:**
- `StagesConfigPage` ou `StagesConfigModal`
- `StageItem` (draggable)
- `ColorPicker`
- `AddStageButton`

---

### Story 4.7: Frontend - Filtros no Kanban
**Como** usuário
**Quero** filtrar leads no Kanban
**Para** focar em segmentos específicos

**Critérios de Aceite:**
- [ ] Barra de filtros acima do Kanban
- [ ] Filtro por tags (multi-select)
- [ ] Filtro por origem
- [ ] Filtro por data de criação
- [ ] Busca rápida por nome
- [ ] Chips mostrando filtros ativos
- [ ] Botão "Limpar filtros"
- [ ] URL reflete filtros (shareable)

**Componente:** `KanbanFilters`

---

### Story 4.8: Backend/Frontend - Realtime Updates
**Como** usuário
**Quero** ver mudanças em tempo real
**Para** colaborar com meu time

**Critérios de Aceite:**
- [ ] Supabase Realtime configurado
- [ ] Subscription na tabela `leads`
- [ ] Novo lead aparece automaticamente
- [ ] Lead movido atualiza em todas as sessões
- [ ] Lead editado atualiza o card
- [ ] Lead removido some do Kanban
- [ ] Indicador de "sincronizando" se conexão cair

**Implementação:**
```typescript
// Frontend - Supabase Realtime
const channel = supabase
  .channel('leads-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'leads' },
    (payload) => {
      // Update local state
    }
  )
  .subscribe()
```

---

## Definição de Pronto (DoD)

- [ ] Kanban carrega em < 2s com 200 leads
- [ ] Drag-and-drop funcionando smooth
- [ ] Estágios customizáveis
- [ ] Realtime funcionando entre abas
- [ ] Responsivo em tablet
- [ ] Touch support funcionando

---

## Considerações de UX

### Performance
- Virtualização de cards se > 100 por coluna
- Lazy load de cards ao scroll
- Debounce em filtros/busca

### Acessibilidade
- Keyboard navigation (Tab, Enter, Arrow keys)
- ARIA labels para screen readers
- Focus visible em cards

---

## Quality Gates

- **@ux-design-expert:** Review de UX do drag-and-drop
- **@qa:** Teste de performance com muitos leads
- **@qa:** Teste de realtime multi-sessão
- **CodeRabbit:** Validação de acessibilidade

---

*Epic criado por @pm (Morgan) - Sistema de Acompanhamento de Leads*
