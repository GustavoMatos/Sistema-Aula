# EPIC-6: Webhooks & Recebimento de Mensagens

**Status:** Ready for Development
**Prioridade:** P1 - High Value
**Estimativa:** 3-4 dias
**Owner:** @dev
**Depende de:** EPIC-2, EPIC-3

---

## Objetivo

Implementar o sistema de webhooks para receber eventos da Evolution API, permitindo registrar mensagens recebidas, atualizar status de conexão e criar leads automaticamente.

---

## Escopo

### Incluído
- Endpoint para receber webhooks da Evolution API
- Processar evento MESSAGES_UPSERT (mensagens recebidas)
- Processar evento CONNECTION_UPDATE (status de conexão)
- Processar evento QRCODE_UPDATED (novo QR Code)
- Salvar mensagens recebidas no histórico
- Atualizar last_contact_at do lead
- Criar lead automaticamente se número novo
- Pausar automação quando lead responde

### Excluído
- Respostas automáticas (chatbot) - v2
- Processamento de mídia recebida - v2
- Análise de sentimento - v2

---

## User Stories

### Story 6.1: Backend - Endpoint de Webhook
**Como** Evolution API
**Quero** enviar eventos para o sistema
**Para** notificar sobre mensagens e conexões

**Critérios de Aceite:**
- [ ] `POST /api/webhooks/evolution` endpoint
- [ ] Validar origem da requisição (IP ou secret)
- [ ] Parsear payload de diferentes eventos
- [ ] Responder 200 rapidamente (processar async)
- [ ] Log de todos os eventos recebidos
- [ ] Tratamento de erros silencioso (não quebrar)

**Headers Esperados:**
```
Content-Type: application/json
X-Webhook-Secret: {secret} (opcional)
```

**Payload Base:**
```json
{
  "event": "messages.upsert",
  "instance": "minha-instancia",
  "data": { ... }
}
```

---

### Story 6.2: Backend - Processar Mensagens Recebidas
**Como** sistema
**Quero** processar mensagens do WhatsApp
**Para** registrar no histórico do lead

**Critérios de Aceite:**
- [ ] Identificar evento `messages.upsert` ou `MESSAGES_UPSERT`
- [ ] Extrair: número, texto, timestamp, message_id
- [ ] Buscar lead pelo número de telefone
- [ ] Se lead existe:
  - [ ] Salvar mensagem em `messages` (direction: inbound)
  - [ ] Atualizar `last_contact_at`
  - [ ] Registrar em `lead_history`
  - [ ] Pausar automação temporariamente (config)
- [ ] Se lead não existe:
  - [ ] Criar novo lead no primeiro estágio
  - [ ] Salvar mensagem
- [ ] Emitir evento para Supabase Realtime

**Payload MESSAGES_UPSERT:**
```json
{
  "event": "messages.upsert",
  "instance": "minha-instancia",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0B430A5..."
    },
    "pushName": "Nome do Contato",
    "message": {
      "conversation": "Texto da mensagem"
    },
    "messageType": "conversation",
    "messageTimestamp": 1717689097
  }
}
```

**Extração do Número:**
```typescript
function extractPhoneNumber(remoteJid: string): string {
  // "5511999999999@s.whatsapp.net" -> "5511999999999"
  return remoteJid.split('@')[0]
}
```

---

### Story 6.3: Backend - Processar Status de Conexão
**Como** sistema
**Quero** atualizar o status da instância WhatsApp
**Para** refletir conexão/desconexão na UI

**Critérios de Aceite:**
- [ ] Identificar evento `connection.update` ou `CONNECTION_UPDATE`
- [ ] Extrair: instance, state
- [ ] Buscar instância no banco
- [ ] Atualizar campo `status`
- [ ] Estados: 'open' → conectado, 'close' → desconectado
- [ ] Emitir evento para Supabase Realtime

**Payload CONNECTION_UPDATE:**
```json
{
  "event": "connection.update",
  "instance": "minha-instancia",
  "data": {
    "instance": "minha-instancia",
    "state": "open"
  }
}
```

---

### Story 6.4: Backend - Processar QR Code Atualizado
**Como** sistema
**Quero** receber novos QR Codes
**Para** exibir na UI durante conexão

**Critérios de Aceite:**
- [ ] Identificar evento `qrcode.updated` ou `QRCODE_UPDATED`
- [ ] Extrair: instance, qrcode (base64 ou pairing code)
- [ ] Atualizar campo `qr_code` da instância
- [ ] Emitir evento para Supabase Realtime
- [ ] UI recebe e atualiza imagem

**Payload QRCODE_UPDATED:**
```json
{
  "event": "qrcode.updated",
  "instance": "minha-instancia",
  "data": {
    "qrcode": "base64_ou_pairing_code"
  }
}
```

---

### Story 6.5: Backend - Configuração Automática de Webhook
**Como** sistema
**Quero** configurar webhook automaticamente
**Para** não exigir configuração manual

**Critérios de Aceite:**
- [ ] Ao criar instância, chamar `/webhook/set`
- [ ] Configurar URL do webhook do nosso backend
- [ ] Ativar eventos necessários:
  - `MESSAGES_UPSERT`
  - `CONNECTION_UPDATE`
  - `QRCODE_UPDATED`
- [ ] Gerar secret único por instância
- [ ] Salvar secret no banco

**Eventos Configurados:**
```json
{
  "url": "https://seu-backend.com/api/webhooks/evolution",
  "enabled": true,
  "webhookByEvents": true,
  "webhookBase64": false,
  "events": [
    "MESSAGES_UPSERT",
    "CONNECTION_UPDATE",
    "QRCODE_UPDATED"
  ]
}
```

---

### Story 6.6: Frontend - Histórico de Mensagens do Lead
**Como** usuário
**Quero** ver todas as mensagens trocadas com o lead
**Para** ter contexto das conversas

**Critérios de Aceite:**
- [ ] Seção "Mensagens" no detalhe do lead
- [ ] Layout estilo chat (bolhas)
- [ ] Mensagens enviadas à direita (azul)
- [ ] Mensagens recebidas à esquerda (cinza)
- [ ] Timestamp em cada mensagem
- [ ] Indicador se foi automática
- [ ] Scroll automático para última mensagem
- [ ] Atualização em tempo real (Realtime)

**Layout:**
```
┌────────────────────────────────────────┐
│ Mensagens                              │
├────────────────────────────────────────┤
│        ┌─────────────────────────────┐ │
│        │ Olá João, tudo bem?         │ │
│        │            14:30 - Auto ⚡  │ │
│        └─────────────────────────────┘ │
│ ┌─────────────────────────────┐        │
│ │ Oi! Tudo sim, e você?       │        │
│ │ 14:35                       │        │
│ └─────────────────────────────┘        │
│        ┌─────────────────────────────┐ │
│        │ Estou bem! Vi que você...   │ │
│        │            14:36            │ │
│        └─────────────────────────────┘ │
├────────────────────────────────────────┤
│ [📷] [Digite sua mensagem...] [Enviar] │
└────────────────────────────────────────┘
```

**Componentes:**
- `MessageHistory`
- `MessageBubble`
- `MessageComposer`

---

### Story 6.7: Frontend - Notificação de Nova Mensagem
**Como** usuário
**Quero** ser notificado quando um lead responder
**Para** poder responder rapidamente

**Critérios de Aceite:**
- [ ] Toast notification quando mensagem chega
- [ ] Badge no ícone de leads com mensagens não lidas
- [ ] Card do lead no Kanban indica "nova mensagem"
- [ ] Som de notificação (opcional, configurável)
- [ ] Click na notificação abre detalhe do lead

**Componentes:**
- `NewMessageToast`
- `UnreadBadge`

---

### Story 6.8: Backend - Criar Lead Automaticamente
**Como** sistema
**Quero** criar lead quando número desconhecido enviar mensagem
**Para** não perder nenhum contato

**Critérios de Aceite:**
- [ ] Se número não existe, criar lead
- [ ] Nome: pushName do WhatsApp ou "Lead WhatsApp"
- [ ] Telefone: número extraído
- [ ] Estágio: primeiro estágio (position = 0)
- [ ] Origem: "WhatsApp"
- [ ] Salvar mensagem recebida
- [ ] Registrar em lead_history (action: lead_created)
- [ ] Configuração para ativar/desativar auto-create

---

## Segurança

### Validação de Webhook
```typescript
function validateWebhook(req: Request): boolean {
  // Opção 1: Validar IP de origem
  const allowedIPs = process.env.EVOLUTION_WEBHOOK_IPS?.split(',')
  if (allowedIPs && !allowedIPs.includes(req.ip)) {
    return false
  }

  // Opção 2: Validar secret header
  const secret = req.headers['x-webhook-secret']
  if (secret !== process.env.WEBHOOK_SECRET) {
    return false
  }

  return true
}
```

### Rate Limiting
- Limite de 100 requisições por minuto por IP
- Proteção contra flood de eventos

---

## Diagrama de Fluxo

```
┌─────────────────┐     ┌─────────────────┐
│   WhatsApp      │────▶│  Evolution API  │
│   (mensagem)    │     │                 │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │    Webhook      │
                        │  /api/webhooks  │
                        └────────┬────────┘
                                 │
                   ┌─────────────┼─────────────┐
                   ▼             ▼             ▼
            ┌──────────┐  ┌──────────┐  ┌──────────┐
            │ MESSAGE  │  │CONNECTION│  │ QRCODE   │
            │ UPSERT   │  │ UPDATE   │  │ UPDATED  │
            └────┬─────┘  └────┬─────┘  └────┬─────┘
                 │             │             │
                 ▼             ▼             ▼
            ┌──────────┐  ┌──────────┐  ┌──────────┐
            │ Salvar   │  │ Atualizar│  │ Atualizar│
            │ mensagem │  │ status   │  │ QR code  │
            │ lead     │  │ instância│  │ instância│
            └────┬─────┘  └────┬─────┘  └────┬─────┘
                 │             │             │
                 └─────────────┼─────────────┘
                               ▼
                        ┌─────────────────┐
                        │    Supabase     │
                        │    Realtime     │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │    Frontend     │
                        │    (update UI)  │
                        └─────────────────┘
```

---

## Definição de Pronto (DoD)

- [ ] Webhook recebendo eventos
- [ ] Mensagens recebidas salvas
- [ ] Status de conexão atualizado
- [ ] Histórico de mensagens exibindo
- [ ] Notificações funcionando
- [ ] Leads auto-criados

---

## Quality Gates

- **@qa:** Teste de webhook com eventos simulados
- **@qa:** Teste de criação automática de lead
- **@qa:** Teste de realtime multi-sessão
- **CodeRabbit:** Validação de segurança do webhook

---

*Epic criado por @pm (Morgan) - Sistema de Acompanhamento de Leads*
