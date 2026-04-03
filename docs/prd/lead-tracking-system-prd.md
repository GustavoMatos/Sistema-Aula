# PRD - Sistema de Acompanhamento de Leads

**Versão:** 1.0
**Data:** 2026-03-30
**Status:** Draft

---

## 1. Visão Geral

### 1.1 Objetivo
Criar um sistema completo de acompanhamento de leads com visualização Kanban, central de gerenciamento, e automação de follow-up via WhatsApp utilizando a Evolution API.

### 1.2 Problema
- Falta de visibilidade do pipeline de vendas
- Follow-ups manuais e inconsistentes
- Perda de leads por falta de acompanhamento
- Dificuldade de rastrear histórico de conversas

### 1.3 Solução
Sistema unificado que permite:
- Visualizar leads em formato Kanban com drag-and-drop
- Centralizar informações de leads
- Automatizar mensagens de follow-up por estágio
- Integrar diretamente com WhatsApp via Evolution API

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | React + Vite |
| UI Components | Tailwind CSS + shadcn/ui |
| State Management | Zustand / React Query |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime |
| WhatsApp | Evolution API v2 |
| Auth | Supabase Auth |

---

## 3. Requisitos Funcionais

### 3.1 Módulo: Gestão de Instâncias WhatsApp

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-WA-001 | Criar nova instância Evolution API | Alta |
| FR-WA-002 | Exibir QR Code para conexão | Alta |
| FR-WA-003 | Monitorar status de conexão (conectado/desconectado) | Alta |
| FR-WA-004 | Listar todas as instâncias | Alta |
| FR-WA-005 | Desconectar/reconectar instância | Média |

**API Endpoints Evolution:**
```
POST /instance/create
GET  /instance/connect/{instance}
GET  /instance/connectionState/{instance}
DELETE /instance/delete/{instance}
```

### 3.2 Módulo: Central de Leads

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-LD-001 | Cadastrar novo lead (manual) | Alta |
| FR-LD-002 | Importar leads (CSV/Excel) | Média |
| FR-LD-003 | Editar informações do lead | Alta |
| FR-LD-004 | Excluir lead (soft delete) | Alta |
| FR-LD-005 | Buscar/filtrar leads | Alta |
| FR-LD-006 | Visualizar histórico de mensagens | Alta |
| FR-LD-007 | Adicionar notas/tags ao lead | Média |
| FR-LD-008 | Receber leads via webhook | Alta |

**Dados do Lead:**
- Nome completo
- Telefone (com código do país)
- Email (opcional)
- Empresa (opcional)
- Origem (formulário, indicação, anúncio, etc.)
- Valor potencial
- Tags personalizadas
- Notas
- Data de criação
- Última interação

### 3.3 Módulo: Kanban

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-KB-001 | Visualizar leads em colunas (estágios) | Alta |
| FR-KB-002 | Arrastar lead entre estágios (drag-and-drop) | Alta |
| FR-KB-003 | Criar novos estágios | Alta |
| FR-KB-004 | Editar nome/cor do estágio | Alta |
| FR-KB-005 | Reordenar estágios | Alta |
| FR-KB-006 | Excluir estágio (move leads para outro) | Média |
| FR-KB-007 | Filtrar por tags/origem/data | Média |
| FR-KB-008 | Visualização compacta/expandida dos cards | Baixa |

**Estágios Padrão:**
1. **Novo Lead** - Lead acabou de entrar
2. **Primeiro Contato** - Aguardando resposta inicial
3. **Qualificação** - Entendendo necessidades
4. **Proposta Enviada** - Proposta/orçamento enviado
5. **Negociação** - Em discussão de termos
6. **Fechado Ganho** - Venda realizada
7. **Fechado Perdido** - Lead não converteu

### 3.4 Módulo: Mensagens Automáticas (Follow-up)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-FU-001 | Configurar mensagem automática por estágio | Alta |
| FR-FU-002 | Definir tempo de espera antes do envio | Alta |
| FR-FU-003 | Configurar múltiplos follow-ups por estágio | Alta |
| FR-FU-004 | Suporte a mensagens de texto | Alta |
| FR-FU-005 | Suporte a envio de imagens | Alta |
| FR-FU-006 | Usar variáveis dinâmicas ({{nome}}, {{empresa}}) | Alta |
| FR-FU-007 | Pausar/ativar automação por lead | Média |
| FR-FU-008 | Log de mensagens enviadas | Alta |
| FR-FU-009 | Horário permitido para envio (ex: 8h-18h) | Média |
| FR-FU-010 | Limite diário de mensagens por lead | Média |

**Exemplo de Configuração:**
```
Estágio: "Primeiro Contato"
Follow-ups:
  1. Após 1 hora: "Olá {{nome}}, tudo bem?"
  2. Após 24 horas: "{{nome}}, vi que você demonstrou interesse..."
  3. Após 72 horas: [Enviar imagem com oferta]
```

**API Endpoints Evolution:**
```
POST /message/sendText/{instance}
POST /message/sendMedia/{instance}
```

### 3.5 Módulo: Webhooks (Receber Mensagens)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-WH-001 | Receber mensagens do WhatsApp | Alta |
| FR-WH-002 | Atualizar última interação do lead | Alta |
| FR-WH-003 | Pausar follow-up quando lead responder | Alta |
| FR-WH-004 | Notificar usuário de nova mensagem | Média |
| FR-WH-005 | Criar lead automaticamente se número novo | Média |

**Eventos Evolution API:**
- `MESSAGES_UPSERT` - Nova mensagem recebida
- `CONNECTION_UPDATE` - Status de conexão alterado
- `QRCODE_UPDATED` - QR Code atualizado

---

## 4. Requisitos Não-Funcionais

| ID | Requisito | Especificação |
|----|-----------|---------------|
| NFR-001 | Performance | Kanban carrega em < 2s com 500 leads |
| NFR-002 | Responsivo | Funcionar em desktop e tablet |
| NFR-003 | Realtime | Atualizações em < 500ms via Supabase Realtime |
| NFR-004 | Segurança | RLS no Supabase, API keys protegidas |
| NFR-005 | Disponibilidade | 99.5% uptime |
| NFR-006 | Escalabilidade | Suportar 10k leads por workspace |

---

## 5. Arquitetura do Banco de Dados

### 5.1 Diagrama ER

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   workspaces    │     │     users       │     │  whatsapp_      │
│─────────────────│     │─────────────────│     │  instances      │
│ id (PK)         │◄────│ id (PK)         │     │─────────────────│
│ name            │     │ workspace_id(FK)│     │ id (PK)         │
│ created_at      │     │ email           │     │ workspace_id(FK)│
└────────┬────────┘     │ role            │     │ instance_name   │
         │              └─────────────────┘     │ api_key         │
         │                                      │ status          │
         ▼                                      │ phone_number    │
┌─────────────────┐                             └─────────────────┘
│  kanban_stages  │
│─────────────────│     ┌─────────────────┐
│ id (PK)         │     │     leads       │
│ workspace_id(FK)│     │─────────────────│
│ name            │◄────│ id (PK)         │
│ color           │     │ workspace_id(FK)│
│ position        │     │ stage_id (FK)   │
│ is_final        │     │ name            │
└─────────────────┘     │ phone           │
                        │ email           │
                        │ company         │
                        │ source          │
                        │ potential_value │
                        │ tags            │
                        │ notes           │
                        │ last_contact_at │
                        │ automation_paused│
                        │ created_at      │
                        └────────┬────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   messages      │     │  followup_      │     │  lead_history   │
│─────────────────│     │  configs        │     │─────────────────│
│ id (PK)         │     │─────────────────│     │ id (PK)         │
│ lead_id (FK)    │     │ id (PK)         │     │ lead_id (FK)    │
│ direction       │     │ stage_id (FK)   │     │ action          │
│ content         │     │ workspace_id(FK)│     │ from_stage_id   │
│ media_url       │     │ delay_hours     │     │ to_stage_id     │
│ status          │     │ message_text    │     │ performed_by    │
│ sent_at         │     │ media_url       │     │ created_at      │
│ whatsapp_msg_id │     │ is_active       │     └─────────────────┘
└─────────────────┘     │ position        │
                        │ send_start_hour │
                        │ send_end_hour   │
                        └─────────────────┘
```

### 5.2 Tabelas Detalhadas

#### workspaces
```sql
- id: UUID PRIMARY KEY
- name: VARCHAR(255) NOT NULL
- settings: JSONB DEFAULT '{}'
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### users
```sql
- id: UUID PRIMARY KEY (ref auth.users)
- workspace_id: UUID REFERENCES workspaces(id)
- email: VARCHAR(255) NOT NULL
- full_name: VARCHAR(255)
- role: VARCHAR(50) DEFAULT 'member' -- admin, member
- created_at: TIMESTAMPTZ DEFAULT NOW()
```

#### whatsapp_instances
```sql
- id: UUID PRIMARY KEY
- workspace_id: UUID REFERENCES workspaces(id)
- instance_name: VARCHAR(100) UNIQUE NOT NULL
- api_key: VARCHAR(255) -- encrypted
- api_url: VARCHAR(500) -- Evolution API server URL
- status: VARCHAR(50) DEFAULT 'disconnected'
- phone_number: VARCHAR(20)
- qr_code: TEXT
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### kanban_stages
```sql
- id: UUID PRIMARY KEY
- workspace_id: UUID REFERENCES workspaces(id)
- name: VARCHAR(100) NOT NULL
- color: VARCHAR(7) DEFAULT '#6366f1'
- position: INTEGER NOT NULL
- is_final: BOOLEAN DEFAULT FALSE -- para estágios "fechado"
- created_at: TIMESTAMPTZ DEFAULT NOW()
```

#### leads
```sql
- id: UUID PRIMARY KEY
- workspace_id: UUID REFERENCES workspaces(id)
- stage_id: UUID REFERENCES kanban_stages(id)
- name: VARCHAR(255) NOT NULL
- phone: VARCHAR(20) NOT NULL
- email: VARCHAR(255)
- company: VARCHAR(255)
- source: VARCHAR(100) -- formulário, indicação, anúncio
- potential_value: DECIMAL(10,2)
- tags: TEXT[] DEFAULT '{}'
- notes: TEXT
- last_contact_at: TIMESTAMPTZ
- automation_paused: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### messages
```sql
- id: UUID PRIMARY KEY
- lead_id: UUID REFERENCES leads(id)
- instance_id: UUID REFERENCES whatsapp_instances(id)
- direction: VARCHAR(10) NOT NULL -- 'inbound' | 'outbound'
- content_type: VARCHAR(20) DEFAULT 'text' -- text, image, document
- content: TEXT
- media_url: VARCHAR(500)
- status: VARCHAR(20) DEFAULT 'pending' -- pending, sent, delivered, read, failed
- whatsapp_message_id: VARCHAR(100)
- is_automated: BOOLEAN DEFAULT FALSE
- followup_config_id: UUID REFERENCES followup_configs(id)
- sent_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ DEFAULT NOW()
```

#### followup_configs
```sql
- id: UUID PRIMARY KEY
- workspace_id: UUID REFERENCES workspaces(id)
- stage_id: UUID REFERENCES kanban_stages(id)
- name: VARCHAR(255) NOT NULL
- delay_hours: INTEGER NOT NULL -- horas após entrar no estágio
- message_type: VARCHAR(20) DEFAULT 'text' -- text, image
- message_text: TEXT
- media_url: VARCHAR(500)
- is_active: BOOLEAN DEFAULT TRUE
- position: INTEGER NOT NULL -- ordem do follow-up
- send_start_hour: INTEGER DEFAULT 8 -- horário início permitido
- send_end_hour: INTEGER DEFAULT 18 -- horário fim permitido
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### lead_history
```sql
- id: UUID PRIMARY KEY
- lead_id: UUID REFERENCES leads(id)
- action: VARCHAR(50) NOT NULL -- stage_change, note_added, message_sent
- from_stage_id: UUID REFERENCES kanban_stages(id)
- to_stage_id: UUID REFERENCES kanban_stages(id)
- metadata: JSONB DEFAULT '{}'
- performed_by: UUID REFERENCES users(id)
- created_at: TIMESTAMPTZ DEFAULT NOW()
```

#### scheduled_messages
```sql
- id: UUID PRIMARY KEY
- lead_id: UUID REFERENCES leads(id)
- followup_config_id: UUID REFERENCES followup_configs(id)
- scheduled_for: TIMESTAMPTZ NOT NULL
- status: VARCHAR(20) DEFAULT 'pending' -- pending, sent, cancelled
- created_at: TIMESTAMPTZ DEFAULT NOW()
```

---

## 6. API Backend (Node.js)

### 6.1 Endpoints

#### WhatsApp Instances
```
POST   /api/whatsapp/instances          - Criar instância
GET    /api/whatsapp/instances          - Listar instâncias
GET    /api/whatsapp/instances/:id/qr   - Obter QR Code
GET    /api/whatsapp/instances/:id/status - Status conexão
DELETE /api/whatsapp/instances/:id      - Remover instância
```

#### Leads
```
POST   /api/leads                       - Criar lead
GET    /api/leads                       - Listar leads (com filtros)
GET    /api/leads/:id                   - Detalhes do lead
PUT    /api/leads/:id                   - Atualizar lead
DELETE /api/leads/:id                   - Soft delete
PATCH  /api/leads/:id/stage             - Mover para outro estágio
POST   /api/leads/import                - Importar CSV
```

#### Kanban Stages
```
POST   /api/stages                      - Criar estágio
GET    /api/stages                      - Listar estágios
PUT    /api/stages/:id                  - Atualizar estágio
DELETE /api/stages/:id                  - Remover estágio
PATCH  /api/stages/reorder              - Reordenar estágios
```

#### Follow-up Configs
```
POST   /api/followups                   - Criar config
GET    /api/followups                   - Listar configs
GET    /api/followups/stage/:stageId    - Configs por estágio
PUT    /api/followups/:id               - Atualizar config
DELETE /api/followups/:id               - Remover config
```

#### Messages
```
GET    /api/leads/:id/messages          - Histórico do lead
POST   /api/leads/:id/messages          - Enviar mensagem manual
```

#### Webhooks (Evolution API)
```
POST   /api/webhooks/evolution          - Receber eventos
```

---

## 7. Fluxos Principais

### 7.1 Fluxo: Conexão WhatsApp
```
1. Usuário clica "Conectar WhatsApp"
2. Frontend chama POST /api/whatsapp/instances
3. Backend chama Evolution API POST /instance/create
4. Backend salva instância no Supabase
5. Frontend chama GET /api/whatsapp/instances/:id/qr
6. Backend chama Evolution API GET /instance/connect/{instance}
7. Frontend exibe QR Code
8. Usuário escaneia com WhatsApp
9. Webhook CONNECTION_UPDATE atualiza status
10. Frontend mostra "Conectado"
```

### 7.2 Fluxo: Lead Move no Kanban
```
1. Usuário arrasta card de "Novo Lead" para "Primeiro Contato"
2. Frontend chama PATCH /api/leads/:id/stage
3. Backend atualiza stage_id do lead
4. Backend cria registro em lead_history
5. Backend agenda follow-ups do novo estágio
6. Backend cancela follow-ups do estágio anterior
7. Supabase Realtime notifica todos os clientes
8. UI atualiza em tempo real
```

### 7.3 Fluxo: Follow-up Automático
```
1. Cron job roda a cada minuto
2. Busca scheduled_messages com scheduled_for <= NOW()
3. Para cada mensagem:
   a. Verifica se lead ainda está no mesmo estágio
   b. Verifica se automation_paused = false
   c. Verifica se está no horário permitido
   d. Substitui variáveis ({{nome}}, etc.)
   e. Chama Evolution API /message/sendText ou /message/sendMedia
   f. Salva em messages com is_automated = true
   g. Atualiza status da scheduled_message
   h. Atualiza last_contact_at do lead
```

### 7.4 Fluxo: Receber Mensagem (Webhook)
```
1. WhatsApp recebe mensagem
2. Evolution API envia webhook MESSAGES_UPSERT
3. Backend recebe em POST /api/webhooks/evolution
4. Backend busca lead pelo número
5. Se lead existe:
   a. Salva mensagem em messages (direction = 'inbound')
   b. Atualiza last_contact_at
   c. Pausa automação temporariamente (optional)
   d. Emite evento Supabase Realtime
6. Se lead não existe:
   a. Cria novo lead no primeiro estágio
   b. Salva mensagem
7. Frontend recebe via Realtime e atualiza UI
```

---

## 8. Telas do Frontend

### 8.1 Dashboard
- Métricas: total de leads, por estágio, conversão
- Gráfico de funil
- Leads recentes
- Status das instâncias WhatsApp

### 8.2 Kanban Board
- Colunas para cada estágio
- Cards com: nome, telefone, tempo no estágio, tags
- Drag-and-drop entre colunas
- Filtros: tags, origem, data
- Botão "+" para adicionar lead
- Modal de detalhes ao clicar no card

### 8.3 Central de Leads (Lista)
- Tabela com todos os leads
- Colunas: nome, telefone, estágio, origem, última interação
- Busca por nome/telefone
- Filtros avançados
- Ações em massa: mover, excluir, adicionar tag

### 8.4 Detalhes do Lead
- Informações completas
- Histórico de mensagens (chat-like)
- Timeline de ações
- Enviar mensagem manual
- Editar informações
- Pausar/ativar automação

### 8.5 Configuração de Estágios
- Lista de estágios com drag-and-drop para reordenar
- Editar nome e cor
- Adicionar/remover estágios
- Indicar estágios finais

### 8.6 Configuração de Follow-ups
- Selecionar estágio
- Lista de follow-ups configurados
- Criar novo:
  - Tempo de espera (horas/dias)
  - Tipo: texto ou imagem
  - Conteúdo com variáveis
  - Horário permitido
- Preview da mensagem

### 8.7 WhatsApp Instances
- Lista de instâncias
- Status de cada uma
- Botão conectar (mostra QR)
- Desconectar/reconectar

---

## 9. Segurança

### 9.1 Row Level Security (RLS)
```sql
-- Todos os selects filtrados por workspace_id
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their workspace leads"
ON leads FOR SELECT
USING (workspace_id = (SELECT workspace_id FROM users WHERE id = auth.uid()));
```

### 9.2 API Keys Evolution
- Armazenar encrypted no banco
- Nunca expor para frontend
- Rotação periódica recomendada

### 9.3 Webhooks
- Validar origem das requisições
- HMAC signature se disponível
- Rate limiting

---

## 10. Roadmap de Desenvolvimento

### Fase 1: MVP (2 semanas)
- [ ] Setup do projeto (React + Node + Supabase)
- [ ] Migrations do banco de dados
- [ ] CRUD de leads
- [ ] Kanban básico (drag-and-drop)
- [ ] Integração Evolution API (criar instância, QR code)
- [ ] Envio de mensagem manual

### Fase 2: Automação (1 semana)
- [ ] Configuração de follow-ups
- [ ] Scheduler de mensagens
- [ ] Webhook para receber mensagens
- [ ] Histórico de mensagens

### Fase 3: Polish (1 semana)
- [ ] Dashboard com métricas
- [ ] Filtros avançados
- [ ] Import de leads (CSV)
- [ ] Melhorias de UX

### Fase 4: Extras (futuro)
- [ ] Múltiplas instâncias WhatsApp
- [ ] Templates de mensagem
- [ ] Relatórios exportáveis
- [ ] Integração com outros canais

---

## 11. Variáveis de Ambiente

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Evolution API
EVOLUTION_API_URL=https://your-evolution-server.com
EVOLUTION_API_GLOBAL_KEY=xxx

# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Webhook
WEBHOOK_SECRET=xxx
```

---

## Aprovação

| Papel | Nome | Data | Status |
|-------|------|------|--------|
| Product Owner | | | Pendente |
| Tech Lead | | | Pendente |
| Stakeholder | | | Pendente |

---

*Documento gerado pelo AIOX Framework*
