# EPIC-3: Central de Leads

**Status:** Ready for Development
**Prioridade:** P0 - Critical Path
**Estimativa:** 4-5 dias
**Owner:** @dev
**Depende de:** EPIC-1

---

## Objetivo

Implementar o módulo completo de gerenciamento de leads, incluindo CRUD, busca, filtros, importação e visualização de detalhes com histórico.

---

## Escopo

### Incluído
- CRUD completo de leads
- Busca e filtros avançados
- Importação via CSV
- Visualização de detalhes
- Histórico de ações
- Tags e notas
- Soft delete

### Excluído
- Visualização Kanban (Epic 4)
- Histórico de mensagens (Epic 6)
- Exportação de dados (v2)

---

## User Stories

### Story 3.1: Backend - CRUD de Leads
**Como** frontend
**Quero** endpoints REST para gerenciar leads
**Para** criar, editar e excluir leads

**Critérios de Aceite:**
- [ ] `POST /api/leads` - Criar lead
- [ ] `GET /api/leads` - Listar leads (paginado)
- [ ] `GET /api/leads/:id` - Detalhes do lead
- [ ] `PUT /api/leads/:id` - Atualizar lead
- [ ] `DELETE /api/leads/:id` - Soft delete
- [ ] `PATCH /api/leads/:id/stage` - Mover estágio
- [ ] Filtros: stage, tags, source, date range
- [ ] Busca por nome ou telefone
- [ ] Ordenação: created_at, last_contact_at, name
- [ ] Paginação com cursor ou offset

**Query Params:**
```
GET /api/leads?
  stage_id=uuid&
  tags=tag1,tag2&
  source=formulario&
  search=João&
  from_date=2024-01-01&
  to_date=2024-12-31&
  sort=created_at&
  order=desc&
  page=1&
  limit=20
```

---

### Story 3.2: Backend - Histórico de Leads
**Como** sistema
**Quero** registrar todas as ações em um lead
**Para** auditoria e timeline

**Critérios de Aceite:**
- [ ] Registrar mudança de estágio
- [ ] Registrar edição de dados
- [ ] Registrar adição de nota
- [ ] Registrar envio de mensagem
- [ ] `GET /api/leads/:id/history` endpoint
- [ ] Incluir `performed_by` (user_id)
- [ ] Ordenar por data decrescente

**Tipos de Ação:**
- `stage_change` - Mudança de estágio
- `lead_updated` - Dados editados
- `note_added` - Nota adicionada
- `tag_added` - Tag adicionada
- `tag_removed` - Tag removida
- `message_sent` - Mensagem enviada
- `message_received` - Mensagem recebida

---

### Story 3.3: Backend - Importação de Leads (CSV)
**Como** usuário
**Quero** importar leads de um arquivo CSV
**Para** migrar dados de outras ferramentas

**Critérios de Aceite:**
- [ ] `POST /api/leads/import` endpoint
- [ ] Aceitar upload de arquivo CSV
- [ ] Mapear colunas: name, phone, email, company, source
- [ ] Validar formato do telefone
- [ ] Ignorar duplicados (por telefone)
- [ ] Retornar relatório: importados, ignorados, erros
- [ ] Limite de 1000 leads por importação

**Response:**
```json
{
  "imported": 45,
  "duplicates": 5,
  "errors": [
    { "row": 12, "error": "Telefone inválido" }
  ]
}
```

---

### Story 3.4: Frontend - Página Lista de Leads
**Como** usuário
**Quero** ver todos os leads em uma tabela
**Para** ter visão geral e buscar rapidamente

**Critérios de Aceite:**
- [ ] Página `/leads` criada
- [ ] Tabela com colunas: Nome, Telefone, Estágio, Origem, Última Interação
- [ ] Busca por nome/telefone
- [ ] Filtros: estágio, tags, origem
- [ ] Ordenação por colunas
- [ ] Paginação
- [ ] Botão "Novo Lead"
- [ ] Click na linha abre detalhes
- [ ] Checkbox para seleção múltipla
- [ ] Ações em massa: mover estágio, adicionar tag, excluir

**Componentes:**
- `LeadsPage`
- `LeadsTable`
- `LeadFilters`
- `LeadSearchInput`
- `BulkActionsBar`

---

### Story 3.5: Frontend - Modal Criar/Editar Lead
**Como** usuário
**Quero** um formulário para criar ou editar leads
**Para** adicionar novos leads ao sistema

**Critérios de Aceite:**
- [ ] Modal com formulário
- [ ] Campos: Nome*, Telefone*, Email, Empresa, Origem, Valor Potencial
- [ ] Seletor de estágio inicial
- [ ] Input de tags (multi-select ou chips)
- [ ] Campo de notas (textarea)
- [ ] Validação de telefone (formato brasileiro)
- [ ] Validação de email
- [ ] Loading state no submit
- [ ] Fechar e atualizar lista após sucesso

**Componentes:**
- `LeadFormModal`
- `PhoneInput` (com máscara)
- `TagsInput`

---

### Story 3.6: Frontend - Página de Detalhes do Lead
**Como** usuário
**Quero** ver todas as informações de um lead
**Para** entender o contexto completo

**Critérios de Aceite:**
- [ ] Página `/leads/:id` criada
- [ ] Seção de informações básicas (editável inline)
- [ ] Seção de tags (adicionar/remover)
- [ ] Seção de notas (adicionar nova nota)
- [ ] Timeline de histórico
- [ ] Indicador de tempo no estágio atual
- [ ] Botão "Enviar Mensagem"
- [ ] Botão "Mover Estágio"
- [ ] Toggle "Pausar Automação"
- [ ] Botão "Excluir Lead" (com confirmação)

**Layout:**
```
┌────────────────────────────────────────────┐
│ ← Voltar          João da Silva      [Edit]│
├────────────────────────────────────────────┤
│ Telefone: (11) 99999-9999                  │
│ Email: joao@email.com                      │
│ Empresa: Empresa X                         │
│ Origem: Formulário                         │
│ Valor: R$ 5.000                            │
│ Estágio: [Qualificação ▼] há 3 dias        │
├────────────────────────────────────────────┤
│ Tags: [Quente] [Decisor] [+]               │
├────────────────────────────────────────────┤
│ Notas                              [+ Add] │
│ • 28/03 - Interessado no plano anual       │
│ • 25/03 - Primeiro contato realizado       │
├────────────────────────────────────────────┤
│ Histórico                                  │
│ ○ 28/03 - Movido para Qualificação         │
│ ○ 25/03 - Mensagem enviada                 │
│ ○ 25/03 - Lead criado                      │
├────────────────────────────────────────────┤
│ Automação: [ON/OFF]  [Pausar até resposta] │
└────────────────────────────────────────────┘
```

**Componentes:**
- `LeadDetailPage`
- `LeadInfoCard`
- `LeadTagsSection`
- `LeadNotesSection`
- `LeadHistoryTimeline`
- `LeadActionsBar`

---

### Story 3.7: Frontend - Importação de CSV
**Como** usuário
**Quero** importar leads de um arquivo CSV
**Para** adicionar múltiplos leads rapidamente

**Critérios de Aceite:**
- [ ] Botão "Importar CSV" na lista de leads
- [ ] Modal com área de drag-and-drop
- [ ] Preview das primeiras 5 linhas
- [ ] Mapeamento de colunas (se necessário)
- [ ] Progress bar durante importação
- [ ] Resultado: X importados, Y ignorados, Z erros
- [ ] Download de template CSV

**Componentes:**
- `ImportCSVModal`
- `FileDropzone`
- `ImportProgress`
- `ImportResults`

---

## Modelo de Dados

### Lead
```typescript
interface Lead {
  id: string
  workspace_id: string
  stage_id: string
  name: string
  phone: string
  email?: string
  company?: string
  source?: string
  potential_value?: number
  tags: string[]
  notes?: string
  last_contact_at?: Date
  automation_paused: boolean
  created_at: Date
  updated_at: Date
}
```

### LeadHistory
```typescript
interface LeadHistory {
  id: string
  lead_id: string
  action: 'stage_change' | 'lead_updated' | 'note_added' | 'message_sent' | ...
  from_stage_id?: string
  to_stage_id?: string
  metadata: Record<string, any>
  performed_by?: string
  created_at: Date
}
```

---

## Definição de Pronto (DoD)

- [ ] CRUD funcionando end-to-end
- [ ] Busca e filtros funcionando
- [ ] Importação CSV testada
- [ ] Timeline de histórico funcionando
- [ ] Responsivo em tablet
- [ ] Sem erros de console

---

## Quality Gates

- **@qa:** Teste de CRUD completo
- **@qa:** Teste de importação com arquivo grande
- **@qa:** Teste de filtros combinados
- **CodeRabbit:** Validação de queries SQL (injection)

---

*Epic criado por @pm (Morgan) - Sistema de Acompanhamento de Leads*
