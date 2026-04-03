# EPIC-2: Integração WhatsApp (Evolution API)

**Status:** Ready for Development
**Prioridade:** P0 - Critical Path
**Estimativa:** 4-5 dias
**Owner:** @dev
**Depende de:** EPIC-1

---

## Objetivo

Implementar a integração completa com a Evolution API para gerenciar instâncias WhatsApp, incluindo criação, conexão via QR Code, monitoramento de status e envio de mensagens.

---

## Escopo

### Incluído
- CRUD de instâncias WhatsApp
- Geração e exibição de QR Code
- Monitoramento de status de conexão
- Envio de mensagens de texto
- Envio de imagens/mídia
- Configuração de webhooks

### Excluído
- Automação de mensagens (Epic 5)
- Recebimento de mensagens (Epic 6)
- Múltiplas instâncias por workspace (v2)

---

## User Stories

### Story 2.1: Backend - Service da Evolution API
**Como** sistema
**Quero** um serviço encapsulado para a Evolution API
**Para** centralizar todas as chamadas à API externa

**Critérios de Aceite:**
- [ ] Classe `EvolutionService` criada
- [ ] Método `createInstance(name, config)` implementado
- [ ] Método `getQRCode(instanceName)` implementado
- [ ] Método `getConnectionStatus(instanceName)` implementado
- [ ] Método `sendText(instanceName, number, text)` implementado
- [ ] Método `sendMedia(instanceName, number, mediaConfig)` implementado
- [ ] Método `setWebhook(instanceName, webhookConfig)` implementado
- [ ] Método `deleteInstance(instanceName)` implementado
- [ ] Tratamento de erros com retry logic
- [ ] Logs de todas as operações

**Arquivo:** `backend/src/services/evolution/evolution.service.ts`

```typescript
interface EvolutionService {
  createInstance(name: string, config?: InstanceConfig): Promise<InstanceResponse>
  getQRCode(instanceName: string): Promise<QRCodeResponse>
  getConnectionStatus(instanceName: string): Promise<ConnectionStatus>
  sendText(instanceName: string, number: string, text: string, options?: SendOptions): Promise<MessageResponse>
  sendMedia(instanceName: string, number: string, media: MediaConfig): Promise<MessageResponse>
  setWebhook(instanceName: string, config: WebhookConfig): Promise<void>
  deleteInstance(instanceName: string): Promise<void>
}
```

---

### Story 2.2: Backend - API de Instâncias
**Como** frontend
**Quero** endpoints REST para gerenciar instâncias
**Para** criar e conectar WhatsApp pela interface

**Critérios de Aceite:**
- [ ] `POST /api/whatsapp/instances` - Criar instância
- [ ] `GET /api/whatsapp/instances` - Listar instâncias do workspace
- [ ] `GET /api/whatsapp/instances/:id` - Detalhes da instância
- [ ] `GET /api/whatsapp/instances/:id/qr` - Obter QR Code
- [ ] `GET /api/whatsapp/instances/:id/status` - Status de conexão
- [ ] `DELETE /api/whatsapp/instances/:id` - Remover instância
- [ ] `POST /api/whatsapp/instances/:id/logout` - Desconectar
- [ ] Validação de input com Zod
- [ ] Autenticação obrigatória

**Arquivo:** `backend/src/routes/whatsapp.routes.ts`

---

### Story 2.3: Backend - Persistência de Instâncias
**Como** sistema
**Quero** salvar instâncias no Supabase
**Para** manter registro e recuperar API keys

**Critérios de Aceite:**
- [ ] Criar instância salva no banco
- [ ] API key da Evolution salva (encrypted recomendado)
- [ ] Status atualizado via webhook ou polling
- [ ] Soft delete implementado
- [ ] Query por workspace_id

**Arquivo:** `backend/src/services/whatsapp-instance.service.ts`

---

### Story 2.4: Frontend - Página de Instâncias WhatsApp
**Como** usuário
**Quero** uma página para gerenciar minhas conexões WhatsApp
**Para** conectar e monitorar o status

**Critérios de Aceite:**
- [ ] Página `/settings/whatsapp` criada
- [ ] Lista de instâncias com status (badge colorido)
- [ ] Botão "Conectar WhatsApp" abre modal
- [ ] Status: Conectado (verde), Desconectado (vermelho), Conectando (amarelo)
- [ ] Ação de desconectar/reconectar
- [ ] Ação de remover instância (com confirmação)

**Componentes:**
- `WhatsAppInstancesPage`
- `InstanceCard`
- `InstanceStatusBadge`
- `DeleteInstanceDialog`

---

### Story 2.5: Frontend - Modal de Conexão com QR Code
**Como** usuário
**Quero** ver o QR Code para conectar meu WhatsApp
**Para** vincular meu número ao sistema

**Critérios de Aceite:**
- [ ] Modal abre ao clicar "Conectar WhatsApp"
- [ ] Input para nome da instância
- [ ] QR Code exibido em tamanho grande
- [ ] Timer de expiração do QR (se aplicável)
- [ ] Polling de status a cada 3 segundos
- [ ] Modal fecha automaticamente quando conectado
- [ ] Mensagem de sucesso ao conectar
- [ ] Tratamento de erro se QR expirar

**Componentes:**
- `ConnectWhatsAppModal`
- `QRCodeDisplay`

**Fluxo:**
```
1. Usuário clica "Conectar WhatsApp"
2. Modal abre, pede nome da instância
3. Sistema cria instância via API
4. Sistema busca QR Code
5. Usuário escaneia com WhatsApp
6. Polling detecta conexão
7. Modal fecha, lista atualiza
```

---

### Story 2.6: Backend - Envio de Mensagens
**Como** sistema
**Quero** enviar mensagens via Evolution API
**Para** permitir comunicação com leads

**Critérios de Aceite:**
- [ ] `POST /api/messages/send` endpoint
- [ ] Suporte a texto simples
- [ ] Suporte a imagem com caption
- [ ] Validação do número (formato internacional)
- [ ] Salvar mensagem no banco (direction: outbound)
- [ ] Atualizar `last_contact_at` do lead
- [ ] Retornar ID da mensagem do WhatsApp

**Request Body:**
```json
{
  "leadId": "uuid",
  "instanceId": "uuid",
  "type": "text | image",
  "content": "Olá!",
  "mediaUrl": "https://...",
  "caption": "Confira!"
}
```

---

### Story 2.7: Frontend - Envio de Mensagem Manual
**Como** usuário
**Quero** enviar mensagens diretamente para um lead
**Para** comunicação rápida sem automação

**Critérios de Aceite:**
- [ ] Input de mensagem no detalhe do lead
- [ ] Botão de enviar texto
- [ ] Botão de anexar imagem
- [ ] Preview da imagem antes de enviar
- [ ] Loading state durante envio
- [ ] Mensagem aparece no histórico após envio
- [ ] Tratamento de erro (instância desconectada)

**Componente:** `MessageComposer`

---

## Definição de Pronto (DoD)

- [ ] Todos os endpoints testados manualmente
- [ ] Conexão via QR Code funcionando
- [ ] Envio de texto funcionando
- [ ] Envio de imagem funcionando
- [ ] Sem erros de console
- [ ] Código revisado

---

## Integrações Técnicas

### Evolution API Endpoints Utilizados

| Operação | Endpoint | Método |
|----------|----------|--------|
| Criar instância | `/instance/create` | POST |
| QR Code | `/instance/connect/{instance}` | GET |
| Status | `/instance/connectionState/{instance}` | GET |
| Enviar texto | `/message/sendText/{instance}` | POST |
| Enviar mídia | `/message/sendMedia/{instance}` | POST |
| Deletar | `/instance/delete/{instance}` | DELETE |

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Evolution API offline | Média | Alto | Health check, fallback UI |
| QR Code expira rápido | Média | Médio | Auto-refresh do QR |
| Ban do WhatsApp | Baixa | Alto | Rate limiting, delays |

---

## Quality Gates

- **@qa:** Teste de fluxo completo de conexão
- **@qa:** Teste de envio de mensagens
- **CodeRabbit:** Validação de segurança (API keys)

---

*Epic criado por @pm (Morgan) - Sistema de Acompanhamento de Leads*
