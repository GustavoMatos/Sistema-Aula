# Lead Tracking System

Sistema de Acompanhamento de Leads com Kanban, Central de Leads e Automação de Follow-up via WhatsApp.

## Stack Tecnológica

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript
- **Database:** Supabase (PostgreSQL)
- **WhatsApp:** Evolution API v2

## Estrutura do Projeto

```
/
├── frontend/          # Aplicação React
├── backend/           # API Node.js
├── docs/              # Documentação
│   ├── prd/           # Product Requirements
│   ├── epics/         # Epic definitions
│   ├── stories/       # User stories
│   ├── architecture/  # Architecture docs
│   └── api-reference/ # API documentation
└── package.json       # Workspace config
```

## Setup

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase
- Acesso à Evolution API

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd lead-tracking-system

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Execute em desenvolvimento
npm run dev
```

### Variáveis de Ambiente

#### Frontend (`frontend/.env.local`)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | ✅ | URL do projeto Supabase (ex: `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Chave anônima do Supabase (encontrada em Settings > API) |
| `VITE_API_URL` | ✅ | URL da API backend (padrão: `http://localhost:3001`) |

```bash
# Exemplo
VITE_SUPABASE_URL=https://jqduuiuqxfarhsvnrgvl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3001
```

#### Backend (`backend/.env`)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NODE_ENV` | ❌ | Ambiente (`development`, `production`, `test`). Padrão: `development` |
| `PORT` | ❌ | Porta do servidor. Padrão: `3001` |
| `SUPABASE_URL` | ✅ (prod) | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | ❌ | Chave anônima do Supabase |
| `SUPABASE_SERVICE_KEY` | ✅ (prod) | Chave de serviço do Supabase (Settings > API > service_role) |
| `EVOLUTION_API_URL` | ❌ | URL da Evolution API (ex: `https://evolution.seudominio.com`) |
| `EVOLUTION_API_KEY` | ❌ | Chave de API da Evolution |
| `FRONTEND_URL` | ❌ | URL do frontend para CORS. Padrão: `http://localhost:5173` |
| `WEBHOOK_BASE_URL` | ❌ | URL base para webhooks em produção |

```bash
# Exemplo
NODE_ENV=development
PORT=3001
SUPABASE_URL=https://jqduuiuqxfarhsvnrgvl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EVOLUTION_API_URL=https://evolution.example.com
EVOLUTION_API_KEY=your-evolution-api-key
FRONTEND_URL=http://localhost:5173
```

#### Onde obter as chaves

1. **Supabase**: Acesse [supabase.com](https://supabase.com) > Seu projeto > Settings > API
2. **Evolution API**: Configure sua instância da Evolution API e obtenha a API key no painel

## Scripts

```bash
# Desenvolvimento
npm run dev              # Roda frontend e backend
npm run dev:frontend     # Apenas frontend
npm run dev:backend      # Apenas backend

# Build
npm run build            # Build de produção

# Testes
npm run test             # Executa testes
npm run lint             # Linting
```

## Documentação

- [PRD](docs/prd/lead-tracking-system-prd.md)
- [Arquitetura](docs/architecture/ARCHITECTURE.md)
- [API Reference](docs/api-reference/evolution-api-reference.md)
- [Roadmap](docs/epics/ROADMAP.md)

## Licença

Privado - Todos os direitos reservados.
