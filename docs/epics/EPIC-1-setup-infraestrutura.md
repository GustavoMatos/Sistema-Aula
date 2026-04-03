# EPIC-1: Setup & Infraestrutura

**Status:** Ready for Development
**Prioridade:** P0 - Critical Path
**Estimativa:** 3-4 dias
**Owner:** @dev + @devops

---

## Objetivo

Estabelecer a fundação técnica do projeto com todas as configurações necessárias para desenvolvimento, incluindo repositório, estrutura de pastas, banco de dados e ambiente de desenvolvimento.

---

## Escopo

### Incluído
- Inicialização do repositório Git
- Setup do projeto React (Vite + TypeScript)
- Setup do projeto Node.js (Express + TypeScript)
- Configuração do Supabase (migrations)
- Configuração de variáveis de ambiente
- Setup de linting e formatação
- Docker para desenvolvimento local (opcional)

### Excluído
- Implementação de features
- Deploy em produção
- CI/CD pipelines (Epic futuro)

---

## User Stories

### Story 1.1: Inicialização do Repositório
**Como** desenvolvedor
**Quero** um repositório Git configurado com estrutura monorepo
**Para** organizar frontend e backend em um único projeto

**Critérios de Aceite:**
- [ ] Repositório Git inicializado
- [ ] Estrutura de pastas criada (frontend/, backend/, docs/)
- [ ] .gitignore configurado para Node.js e React
- [ ] README.md com instruções de setup

**Arquivos:**
```
/
├── frontend/
├── backend/
├── docs/
├── .gitignore
├── README.md
└── package.json (workspaces)
```

---

### Story 1.2: Setup do Frontend (React)
**Como** desenvolvedor
**Quero** o projeto React configurado com Vite e TypeScript
**Para** desenvolver a interface do usuário

**Critérios de Aceite:**
- [ ] Vite + React + TypeScript inicializado
- [ ] Tailwind CSS configurado
- [ ] shadcn/ui instalado e configurado
- [ ] React Router configurado
- [ ] Estrutura de pastas definida
- [ ] ESLint + Prettier configurados
- [ ] Supabase client configurado

**Dependências npm:**
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "@supabase/supabase-js": "^2.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x",
    "@dnd-kit/core": "^6.x",
    "lucide-react": "latest"
  }
}
```

**Estrutura frontend/:**
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn components
│   │   ├── kanban/
│   │   ├── leads/
│   │   └── layout/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── stores/
│   ├── types/
│   └── App.tsx
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

### Story 1.3: Setup do Backend (Node.js)
**Como** desenvolvedor
**Quero** o projeto Node.js configurado com Express e TypeScript
**Para** criar a API do sistema

**Critérios de Aceite:**
- [ ] Express + TypeScript inicializado
- [ ] Estrutura de pastas MVC definida
- [ ] Supabase client configurado (service role)
- [ ] Middleware de autenticação preparado
- [ ] CORS configurado
- [ ] Error handling global
- [ ] Logging configurado
- [ ] Variáveis de ambiente com dotenv

**Dependências npm:**
```json
{
  "dependencies": {
    "express": "^4.x",
    "@supabase/supabase-js": "^2.x",
    "cors": "^2.x",
    "dotenv": "^16.x",
    "axios": "^1.x",
    "node-cron": "^3.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tsx": "^4.x",
    "@types/express": "^4.x",
    "@types/node": "^20.x"
  }
}
```

**Estrutura backend/:**
```
backend/
├── src/
│   ├── config/
│   │   ├── supabase.ts
│   │   └── evolution.ts
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   │   ├── evolution/
│   │   └── scheduler/
│   ├── types/
│   ├── utils/
│   └── index.ts
├── .env.example
├── tsconfig.json
└── package.json
```

---

### Story 1.4: Migrations do Supabase
**Como** desenvolvedor
**Quero** todas as tabelas do banco de dados criadas
**Para** começar a implementar as features

**Critérios de Aceite:**
- [ ] Tabela `workspaces` criada
- [ ] Tabela `users` criada com FK para auth.users
- [ ] Tabela `whatsapp_instances` criada
- [ ] Tabela `kanban_stages` criada com dados padrão
- [ ] Tabela `leads` criada
- [ ] Tabela `messages` criada
- [ ] Tabela `followup_configs` criada
- [ ] Tabela `scheduled_messages` criada
- [ ] Tabela `lead_history` criada
- [ ] RLS policies básicas aplicadas
- [ ] Índices criados para performance

---

### Story 1.5: Configuração de Variáveis de Ambiente
**Como** desenvolvedor
**Quero** todas as variáveis de ambiente documentadas
**Para** configurar o projeto em qualquer ambiente

**Critérios de Aceite:**
- [ ] .env.example criado no frontend
- [ ] .env.example criado no backend
- [ ] Documentação das variáveis no README
- [ ] Validação de variáveis obrigatórias no startup

**Variáveis Frontend (.env):**
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:3001
```

**Variáveis Backend (.env):**
```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

EVOLUTION_API_URL=
EVOLUTION_API_KEY=

FRONTEND_URL=http://localhost:5173
```

---

## Definição de Pronto (DoD)

- [ ] Código commitado e pushado
- [ ] README atualizado com instruções
- [ ] `npm install && npm run dev` funciona em ambos projetos
- [ ] Migrations aplicadas no Supabase
- [ ] Sem erros de linting
- [ ] Estrutura de pastas documentada

---

## Dependências

| Dependência | Tipo | Status |
|-------------|------|--------|
| Projeto Supabase ativo | Externa | ✅ AIOXSUPABASE |
| Evolution API URL | Externa | Aguardando |
| Node.js 18+ | Sistema | Verificar |

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Versão Node incompatível | Baixa | Alto | Usar nvm |
| Supabase fora do ar | Baixa | Alto | Usar local dev |

---

## Quality Gates

- **CodeRabbit:** Validação de estrutura
- **@qa:** Review de configurações de segurança
- **@devops:** Validação de .env e Docker

---

*Epic criado por @pm (Morgan) - Sistema de Acompanhamento de Leads*
