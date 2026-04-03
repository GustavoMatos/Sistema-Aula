# Evolution API v2 - Referência

## Configuração Base

```
Base URL: https://{seu-servidor}/
Header: apikey: {sua-chave-api}
Content-Type: application/json
```

---

## 1. Instâncias

### Criar Instância

```http
POST /instance/create
```

**Headers:**
```
apikey: {global-api-key}
Content-Type: application/json
```

**Body:**
```json
{
  "instanceName": "minha-instancia",
  "integration": "WHATSAPP-BAILEYS",
  "qrcode": true,
  "rejectCall": false,
  "groupsIgnore": true,
  "alwaysOnline": false,
  "readMessages": true,
  "readStatus": false,
  "syncFullHistory": false
}
```

**Response (201):**
```json
{
  "instance": {
    "instanceName": "minha-instancia",
    "instanceId": "af6c5b7c-ee27-4f94-9ea8-192393746ddd",
    "status": "created"
  },
  "hash": {
    "apikey": "123456"
  },
  "settings": {
    "reject_call": false,
    "groups_ignore": true,
    "always_online": false
  }
}
```

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| instanceName | string | Sim | Nome único da instância |
| integration | string | Sim | `WHATSAPP-BAILEYS` ou `WHATSAPP-BUSINESS` |
| qrcode | boolean | Não | Gerar QR code automaticamente |
| token | string | Não | API key customizada (gerada se vazio) |
| number | string | Não | Número do proprietário com código do país |
| rejectCall | boolean | Não | Rejeitar chamadas automaticamente |
| groupsIgnore | boolean | Não | Ignorar mensagens de grupo |
| alwaysOnline | boolean | Não | Manter sempre online |
| readMessages | boolean | Não | Marcar mensagens como lidas |
| syncFullHistory | boolean | Não | Sincronizar histórico completo |

---

### Conectar Instância (QR Code)

```http
GET /instance/connect/{instanceName}
```

**Headers:**
```
apikey: {instance-api-key}
```

**Query Params:**
```
?number={telefone-com-codigo-pais}  (opcional)
```

**Response (200):**
```json
{
  "pairingCode": "WZYEH1YY",
  "code": "2@y8eK+bjtEjUWy9/FOM...",
  "count": 1
}
```

**Observação:** O `pairingCode` é usado para emparelhamento via código. Para QR Code visual, use o endpoint de QR ou a resposta base64.

---

### Status da Conexão

```http
GET /instance/connectionState/{instanceName}
```

**Headers:**
```
apikey: {instance-api-key}
```

**Response (200):**
```json
{
  "instance": {
    "instanceName": "minha-instancia",
    "state": "open"
  }
}
```

**Estados possíveis:**
- `open` - Conectado
- `close` - Desconectado
- `connecting` - Conectando

---

### Logout da Instância

```http
DELETE /instance/logout/{instanceName}
```

**Headers:**
```
apikey: {instance-api-key}
```

---

### Deletar Instância

```http
DELETE /instance/delete/{instanceName}
```

**Headers:**
```
apikey: {instance-api-key}
```

---

## 2. Mensagens

### Enviar Texto

```http
POST /message/sendText/{instanceName}
```

**Headers:**
```
apikey: {instance-api-key}
Content-Type: application/json
```

**Body:**
```json
{
  "number": "5511999999999",
  "text": "Olá, tudo bem?",
  "delay": 1000,
  "linkPreview": true
}
```

**Response (201):**
```json
{
  "key": {
    "remoteJid": "5511999999999@s.whatsapp.net",
    "fromMe": true,
    "id": "BAE594145F4C59B4"
  },
  "message": {
    "extendedTextMessage": {
      "text": "Olá, tudo bem?"
    }
  },
  "messageTimestamp": "1717689097",
  "status": "PENDING"
}
```

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| number | string | Sim | Número com código do país (sem +) |
| text | string | Sim | Texto da mensagem |
| delay | integer | Não | Delay em ms antes de enviar |
| linkPreview | boolean | Não | Mostrar preview de links |
| mentionsEveryOne | boolean | Não | Mencionar todos (grupos) |
| mentioned | array | Não | Números para mencionar |

---

### Enviar Mídia (Imagem)

```http
POST /message/sendMedia/{instanceName}
```

**Headers:**
```
apikey: {instance-api-key}
Content-Type: application/json
```

**Body:**
```json
{
  "number": "5511999999999",
  "mediatype": "image",
  "mimetype": "image/png",
  "caption": "Confira nossa oferta!",
  "media": "https://exemplo.com/imagem.png",
  "fileName": "oferta.png"
}
```

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| number | string | Sim | Número com código do país |
| mediatype | string | Sim | `image`, `video`, `audio`, `document` |
| mimetype | string | Sim | MIME type do arquivo |
| caption | string | Não | Legenda da mídia |
| media | string | Sim | URL ou base64 da mídia |
| fileName | string | Não | Nome do arquivo |
| delay | integer | Não | Delay em ms |

**Media Types suportados:**
- `image` - Imagens (jpg, png, gif, webp)
- `video` - Vídeos (mp4, 3gp)
- `audio` - Áudios (mp3, ogg, wav)
- `document` - Documentos (pdf, doc, xls, etc)

---

## 3. Webhooks

### Configurar Webhook

```http
POST /webhook/set/{instanceName}
```

**Headers:**
```
apikey: {instance-api-key}
Content-Type: application/json
```

**Body:**
```json
{
  "url": "https://seu-servidor.com/api/webhooks/evolution",
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

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| url | string | Sim | URL para receber webhooks |
| enabled | boolean | Sim | Ativar/desativar webhook |
| webhookByEvents | boolean | Não | Separar por eventos |
| webhookBase64 | boolean | Não | Enviar arquivos em base64 |
| events | array | Sim | Lista de eventos |

---

### Eventos Disponíveis

#### Conexão
| Evento | Descrição |
|--------|-----------|
| `APPLICATION_STARTUP` | API iniciou |
| `CONNECTION_UPDATE` | Status de conexão alterado |
| `QRCODE_UPDATED` | QR Code atualizado |
| `NEW_JWT_TOKEN` | Novo token JWT |

#### Mensagens
| Evento | Descrição |
|--------|-----------|
| `MESSAGES_SET` | Conjunto de mensagens |
| `MESSAGES_UPSERT` | Nova mensagem recebida/enviada |
| `MESSAGES_UPDATE` | Mensagem atualizada (status) |
| `MESSAGES_DELETE` | Mensagem deletada |
| `SEND_MESSAGE` | Mensagem enviada |

#### Contatos e Chats
| Evento | Descrição |
|--------|-----------|
| `CONTACTS_SET` | Contatos sincronizados |
| `CONTACTS_UPSERT` | Contato adicionado/atualizado |
| `CONTACTS_UPDATE` | Contato atualizado |
| `CHATS_SET` | Chats sincronizados |
| `CHATS_UPSERT` | Chat adicionado/atualizado |
| `CHATS_UPDATE` | Chat atualizado |
| `CHATS_DELETE` | Chat deletado |

#### Grupos
| Evento | Descrição |
|--------|-----------|
| `GROUPS_UPSERT` | Grupo adicionado |
| `GROUP_UPDATE` | Grupo atualizado |
| `GROUP_PARTICIPANTS_UPDATE` | Participantes atualizados |

#### Outros
| Evento | Descrição |
|--------|-----------|
| `PRESENCE_UPDATE` | Status de presença |
| `CALL` | Chamada recebida |

---

### Payload do Webhook (MESSAGES_UPSERT)

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

---

### Payload do Webhook (CONNECTION_UPDATE)

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

## 4. Buscar Informações

### Informações da Instância

```http
GET /instance/fetchInstances
```

**Headers:**
```
apikey: {global-api-key}
```

**Response:**
```json
[
  {
    "instance": {
      "instanceName": "minha-instancia",
      "instanceId": "xxx",
      "status": "open",
      "serverUrl": "https://...",
      "apikey": "xxx"
    }
  }
]
```

---

## 5. Formato dos Números

**Importante:** Todos os números devem incluir o código do país, SEM o sinal de +.

| País | Formato | Exemplo |
|------|---------|---------|
| Brasil | 55 + DDD + Número | `5511999999999` |
| EUA | 1 + Area Code + Número | `12125551234` |
| Portugal | 351 + Número | `351912345678` |

**Para grupos:**
```
{groupId}@g.us
```

---

## 6. Tratamento de Erros

### Códigos HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Bad Request - Parâmetros inválidos |
| 401 | Unauthorized - API key inválida |
| 404 | Not Found - Instância não encontrada |
| 500 | Internal Server Error |

### Exemplo de Erro

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Instance not found"
}
```

---

## 7. Rate Limits

- Recomendado: 20 mensagens/minuto por instância
- Máximo: 60 mensagens/minuto (risco de ban)
- Delay mínimo recomendado entre mensagens: 3000ms

---

*Documentação baseada na Evolution API v2*
