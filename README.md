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

**Frontend (.env.local):**
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

**Backend (.env):**
```
PORT=3001
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
EVOLUTION_API_URL=your-evolution-api-url
EVOLUTION_API_KEY=your-api-key
```

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
