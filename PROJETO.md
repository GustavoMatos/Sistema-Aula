# Lead Tracker — Documentação Completa do Projeto

> Documento de handoff para replicação do sistema em uma nova sessão de desenvolvimento.
> Criado em: Abril 2026

---

## 1. Visão Geral

**Lead Tracker** é um sistema SaaS multi-tenant para gestão de leads e automação de mensagens via WhatsApp. Cada empresa (tenant) tem seus próprios leads, kanban, mensagens e instâncias WhatsApp, com isolamento total de dados via RLS no Supabase.

### O que o sistema faz
- Cadastro e gestão de leads com histórico completo
- Kanban drag-and-drop com stages customizáveis por empresa
- Envio de mensagens WhatsApp via Evolution API
- Follow-ups automáticos por stage (cron jobs)
- Dashboard com métricas por tenant
- Sistema de convites por email (invite-only, sem auto-registro)
- Multi-tenancy com 3 níveis de role: superadmin, admin_tenant, user_tenant

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| Roteamento | React Router v7 |
| Estado assíncrono | TanStack Query v5 |
| Estado global | Zustand v5 |
| UI components | shadcn/ui + Radix UI |
| CSS | Tailwind CSS v3 |
| Drag and drop | @dnd-kit |
| Forms | React Hook Form + Zod |
| Notificações | Sonner |
| Backend | Express + TypeScript |
| Runtime | tsx (TypeScript direto, sem build dev) |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth (JWT) |
| Email | Resend |
| WhatsApp | Evolution API |
| Logging | Winston |
| Agendamento | node-cron |
| Deploy frontend | Netlify |
| Deploy backend | Easypanel (Docker) |

---

## 3. Arquitetura

```
Browser
  │
  ├── React (Netlify)
  │     ├── Supabase JS Client → Supabase Auth (login/JWT)
  │     └── apiClient → Backend API (todas as outras calls)
  │
  └── Backend Express (Easypanel/Docker)
        ├── Auth Middleware (valida JWT via Supabase)
        ├── Controllers → Supabase Service Role (CRUD direto)
        ├── Evolution API (WhatsApp)
        └── Resend (emails de convite)

Supabase
  ├── PostgreSQL + RLS (isolamento por tenant_id)
  ├── Auth (JWT tokens)
  └── Storage (opcional)
```

### Fluxo de autenticação
1. Usuário faz login no frontend → Supabase Auth retorna JWT
2. Frontend inclui JWT no header `Authorization: Bearer <token>` em todas as chamadas ao backend
3. Backend valida JWT via Supabase, carrega `req.user` com `{ id, email, role, tenant_id }`
4. RLS no banco garante isolamento mesmo se o backend cometer erros

---

## 4. Estrutura de Pastas

```
Sistema Aula/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.ts          # Variáveis de ambiente tipadas
│   │   │   └── supabase.ts       # Cliente Supabase service role
│   │   ├── controllers/
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── followups.controller.ts
│   │   │   ├── invitations.controller.ts
│   │   │   ├── kanban.controller.ts
│   │   │   ├── leads.controller.ts
│   │   │   ├── messages.controller.ts
│   │   │   ├── tenants.controller.ts
│   │   │   ├── users.controller.ts
│   │   │   └── whatsapp.controller.ts
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts  # JWT validation + role guards
│   │   ├── routes/
│   │   │   ├── index.ts            # Roteador principal
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── followups.routes.ts
│   │   │   ├── health.routes.ts
│   │   │   ├── invitations.routes.ts
│   │   │   ├── kanban.routes.ts
│   │   │   ├── leads.routes.ts
│   │   │   ├── messages.routes.ts
│   │   │   ├── tenants.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── webhook.routes.ts
│   │   │   └── whatsapp.routes.ts
│   │   ├── services/
│   │   │   ├── dashboard.service.ts
│   │   │   ├── email.service.ts    # Resend integration
│   │   │   ├── followups.service.ts
│   │   │   ├── import.service.ts   # CSV import
│   │   │   ├── kanban.service.ts
│   │   │   ├── leads.service.ts
│   │   │   ├── messages.service.ts
│   │   │   ├── webhook.service.ts
│   │   │   └── whatsapp-instance.service.ts
│   │   ├── types/index.ts
│   │   ├── utils/
│   │   │   ├── errors.ts           # BadRequestError, NotFoundError, etc.
│   │   │   └── logger.ts           # Winston config
│   │   ├── app.ts                  # Express setup + CORS
│   │   └── index.ts                # Entry point
│   ├── .env
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/Layout.tsx   # Sidebar + header
│   │   │   └── ui/                 # shadcn components
│   │   ├── hooks/
│   │   │   ├── useCurrentUser.ts   # Hook do usuário logado
│   │   │   └── useKanbanStages.ts
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── client.ts       # apiClient com JWT automático
│   │   │   │   ├── followups.ts
│   │   │   │   ├── kanban.ts
│   │   │   │   ├── leads.ts
│   │   │   │   ├── tenants.ts
│   │   │   │   ├── users.ts
│   │   │   │   └── whatsapp.ts
│   │   │   └── supabase.ts         # Supabase client (anon key)
│   │   ├── pages/
│   │   │   ├── Admin/
│   │   │   │   ├── Users.tsx       # Gerenciar usuários e convites
│   │   │   │   └── index.ts
│   │   │   ├── Auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── AcceptInvite.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Dashboard/
│   │   │   ├── Kanban/
│   │   │   ├── Leads/
│   │   │   └── Settings/
│   │   ├── types/index.ts
│   │   └── App.tsx                 # Rotas + ProtectedRoute
│   ├── .env
│   ├── package.json
│   └── vite.config.ts
│
└── supabase/
    └── migrations/
        ├── 20240407_001_multi_tenant_roles.sql
        └── 20240407_002_create_superadmin.sql
```

---

## 5. Banco de Dados

### Tabelas principais

| Tabela | Descrição |
|--------|-----------|
| `auth.users` | Gerenciado pelo Supabase Auth |
| `public.users` | Perfil + role + tenant_id (espelha auth.users) |
| `public.tenants` | Empresas/organizações |
| `public.invitations` | Convites pendentes/aceitos |
| `public.leads` | Contatos/leads |
| `public.kanban_stages` | Colunas do kanban por tenant |
| `public.kanban_cards` | Cards no kanban |
| `public.messages` | Histórico de mensagens WhatsApp |
| `public.whatsapp_instances` | Instâncias conectadas |
| `public.followups` | Regras de automação por stage |
| `public.lead_history` | Auditoria de movimentações |
| `public.attachments` | Arquivos anexados |

### Schema das tabelas de sistema

```sql
-- ENUM de roles
CREATE TYPE user_role AS ENUM ('superadmin', 'admin_tenant', 'user_tenant');

-- Tenants (empresas)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    plan TEXT DEFAULT 'free',       -- 'free' | 'basic' | 'pro'
    max_users INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários (linked to auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL,
    full_name TEXT,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role user_role DEFAULT 'user_tenant',
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convites
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user_tenant',
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_pending_invitation UNIQUE (email, tenant_id)
);
```

### RLS (Row Level Security)

Todas as tabelas têm RLS habilitado. Regras gerais:

- **superadmin**: acesso total a tudo
- **admin_tenant**: CRUD completo nos dados do próprio tenant
- **user_tenant**: leitura + criação + atualização (sem delete) nos dados do tenant

Funções helper no banco:
```sql
get_user_role()       → user_role  -- role do usuário logado
get_user_tenant_id()  → UUID       -- tenant_id do usuário logado
is_superadmin()       → BOOLEAN
is_tenant_admin()     → BOOLEAN    -- admin_tenant OR superadmin
```

---

## 6. Sistema Multi-Tenant

### 3 Níveis de Role

```
superadmin
├── Acesso a todos os tenants
├── Criar/editar/deletar tenants
├── Gerenciar admins de tenants
└── Dashboard global

admin_tenant
├── Gerenciar apenas o próprio tenant
├── Convidar usuários (role user_tenant apenas)
├── CRUD completo em leads, kanban, whatsapp
└── Ver analíticos do tenant

user_tenant
├── Criar/ler/atualizar leads (sem delete)
├── Enviar mensagens
├── Ver follow-ups
└── Sem acesso a configurações
```

### Fluxo de Convite

```
1. Admin → POST /api/invitations { email, role }
   → Cria registro em invitations com token único
   → Envia email via Resend com link /invite/:token

2. Convidado acessa /invite/:token
   → Frontend chama GET /api/invitations/validate/:token
   → Exibe formulário de criação de senha

3. Convidado submete senha → POST /api/invitations/accept/:token
   → Backend cria usuário no Supabase Auth (email_confirm: true)
   → Cria registro em public.users com tenant_id e role
   → Marca invitation.accepted_at = NOW()

4. Convidado faz login normalmente
```

### Reenvio de Convite

```
POST /api/invitations/:id/resend
→ Verifica que convite existe, não foi aceito e não expirou
→ Reenvia email com mesmo token/link
```

---

## 7. API Backend — Rotas Completas

### Públicas (sem autenticação)
```
GET  /health
GET  /api/invitations/validate/:token
POST /api/invitations/accept/:token
POST /webhooks/evolution
POST /webhooks/evolution/:instanceName
```

### Autenticadas (qualquer role)
```
GET  /api/users/me
PUT  /api/users/me
GET  /api/leads
POST /api/leads
GET  /api/leads/:id
PUT  /api/leads/:id
DELETE /api/leads/:id
PATCH  /api/leads/:id/stage
GET  /api/leads/:id/history
POST /api/leads/import
GET  /api/messages/lead/:leadId
POST /api/messages/send
GET  /api/kanban/board
GET  /api/kanban/stages
POST /api/kanban/stages
PUT  /api/kanban/stages/:id
DELETE /api/kanban/stages/:id
POST /api/kanban/stages/reorder
GET  /api/followups
POST /api/followups
PUT  /api/followups/:id
DELETE /api/followups/:id
POST /api/followups/:id/complete
GET  /api/dashboard/stats
GET  /api/whatsapp/instances
POST /api/whatsapp/instances
GET  /api/whatsapp/instances/:id/qr
GET  /api/whatsapp/instances/:id/status
```

### Admin (admin_tenant ou superadmin)
```
GET    /api/users
PUT    /api/users/:id
DELETE /api/users/:id
POST   /api/invitations
GET    /api/invitations
POST   /api/invitations/:id/resend
DELETE /api/invitations/:id
```

### Superadmin only
```
GET    /api/tenants
POST   /api/tenants
POST   /api/tenants/with-admin
GET    /api/tenants/:id
PUT    /api/tenants/:id
DELETE /api/tenants/:id
GET    /api/tenants/dashboard
```

---

## 8. Variáveis de Ambiente

### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://sua-instancia-evolution.com/
EVOLUTION_API_KEY=sua-chave-aqui

# Webhook (URL pública do backend para Evolution API)
WEBHOOK_BASE_URL=https://seu-backend.com

# CORS
FRONTEND_URL=https://seu-frontend.netlify.app

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@seudominio.com.br
APP_NAME=Lead Tracker

# Kestra (Agente conversacional — futuro)
KESTRA_URL=
KESTRA_USERNAME=
KESTRA_PASSWORD=
```

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:3001
```

---

## 9. Configuração do Supabase

### Projeto
- **Project ID**: jqduuiuqxfarhsvnrgvl
- **Região**: sa-east-1 (São Paulo)

### Passos para configurar do zero

1. Criar projeto no Supabase
2. Executar migration `20240407_001_multi_tenant_roles.sql` no SQL Editor
3. Executar `20240407_002_create_superadmin.sql` (editar email/senha antes)
4. Em Authentication > Providers > Email: **desabilitar "Enable email signup"**
5. Copiar `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` para `.env`

### Criar superadmin
```sql
-- Editar antes de executar:
DO $$
DECLARE
    superadmin_email TEXT := 'admin@suaempresa.com';
    superadmin_name  TEXT := 'Super Admin';
    superadmin_id    UUID; -- preencher com o ID do usuário do Supabase Auth
BEGIN
    INSERT INTO public.users (id, email, full_name, role, is_active)
    VALUES (superadmin_id, superadmin_email, superadmin_name, 'superadmin', true)
    ON CONFLICT (id) DO UPDATE SET role = 'superadmin';
END $$;
```

---

## 10. Email com Resend

### Configuração
1. Criar conta em resend.com
2. Adicionar domínio (ex: `seudominio.com.br`)
3. Adicionar registros DNS no provedor do domínio:
   - TXT: `resend._domainkey` → DKIM key fornecida pelo Resend
   - MX: `send` → `feedback-smtp.sa-east-1.amazonses.com` (priority 10)
   - TXT: `send` → `v=spf1 include:amazonses.com ~all`
   - TXT: `_dmarc` → `v=DMARC1; p=none;`
4. Clicar "I've added the records" no Resend
5. Aguardar status "Verified"
6. Preencher `RESEND_API_KEY` e `EMAIL_FROM` no `.env`

### Funcionamento
- Email de convite é enviado automaticamente ao criar invitation
- Botão "Reenviar" na UI para reenviar email de convite existente
- Template HTML já incluído em `backend/src/services/email.service.ts`

---

## 11. WhatsApp via Evolution API

### O que é
Evolution API é um wrapper sobre WhatsApp Web que expõe uma REST API para enviar/receber mensagens.

### Configuração
1. Deploy da Evolution API (Docker recomendado)
2. Preencher `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` no `.env`
3. Preencher `WEBHOOK_BASE_URL` com a URL pública do backend
4. No sistema: ir em WhatsApp → criar instância → escanear QR code

### Webhook
A Evolution API envia eventos (mensagens recebidas, status) para:
```
POST {WEBHOOK_BASE_URL}/webhooks/evolution
POST {WEBHOOK_BASE_URL}/webhooks/evolution/:instanceName
```

---

## 12. Frontend — Páginas e Rotas

| Rota | Componente | Acesso |
|------|-----------|--------|
| `/login` | `Auth/Login.tsx` | Público |
| `/invite/:token` | `Auth/AcceptInvite.tsx` | Público |
| `/` | `Dashboard/` | Autenticado |
| `/leads` | `Leads/` | Autenticado |
| `/leads/:id` | `Leads/LeadDetail` | Autenticado |
| `/kanban` | `Kanban/` | Autenticado |
| `/whatsapp` | `WhatsApp/` | Autenticado |
| `/settings` | `Settings/` | Autenticado |
| `/usuarios` | `Admin/Users.tsx` | admin_tenant + superadmin |

### Componente de usuário atual
```typescript
// hooks/useCurrentUser.ts
const { currentUser, isLoading, error, isSuperadmin, isAdminTenant } = useCurrentUser()
// currentUser: { id, email, full_name, role, tenant: { id, name, slug, plan } }
```

### apiClient
```typescript
// lib/api/client.ts
// Automaticamente injeta o JWT do Supabase em todas as requisições
const data = await apiClient.get('/api/leads')
const data = await apiClient.post('/api/leads', { name: 'João' })
const data = await apiClient.put('/api/leads/123', { name: 'João Silva' })
const data = await apiClient.delete('/api/leads/123')
```

---

## 13. Deploy

### Backend (Easypanel / Docker)
```dockerfile
# Dockerfile na raiz do backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npx", "tsx", "src/index.ts"]
```

Variáveis de ambiente configuradas no painel do Easypanel.

### Frontend (Netlify)
- Build command: `npm run build`
- Publish directory: `dist`
- Variáveis de ambiente configuradas no painel do Netlify
- URL atual: `https://gangus.netlify.app`

---

## 14. Problemas Conhecidos e Soluções

### Duplicate FK constraint
```sql
-- Se aparecer erro de ambiguidade em joins do PostgREST:
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_workspace_id_fkey;
```

### Trigger de kanban stages
```sql
-- Trigger on_workspace_created precisa usar tenant_id (não workspace_id):
-- Ver migration 20240407_001 para a versão correta
```

### CORS local
O backend aceita origens:
- `http://localhost:5173`
- `http://localhost:5174`
- URL do Netlify configurada em `FRONTEND_URL`

---

## 15. Próximos Passos Planejados

- [ ] **Agente conversacional via Kestra** — Motor de AI com memória de sessão
  - Plugin: `io.kestra.plugin.ai.agent.AIAgent`
  - Provider: Anthropic (claude-sonnet-4-6)
  - Memória: KestraKVStore por session_id
  - Fluxo: Frontend → Backend → API Kestra → AIAgent → resposta

- [ ] Erros 400 no Kanban (query `order=position.asc`) — investigar

- [ ] Testes automatizados

- [ ] Importação de leads via CSV (endpoint existe, verificar UI)

---

## 16. Comandos Úteis

```bash
# Backend — desenvolvimento
cd backend && npm run dev

# Frontend — desenvolvimento
cd frontend && npm run dev

# Verificar porta ocupada
lsof -ti:3001 | xargs kill -9

# Verificar DNS propagado
dig TXT resend._domainkey.seudominio.com.br +short
dig MX send.seudominio.com.br +short

# Ver logs do backend
tail -f /tmp/backend-aula.log
```
