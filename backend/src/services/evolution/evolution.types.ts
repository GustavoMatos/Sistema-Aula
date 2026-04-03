// Evolution API v2 Types

// ==================== Instance Types ====================

export interface InstanceConfig {
  qrcode?: boolean
  rejectCall?: boolean
  groupsIgnore?: boolean
  alwaysOnline?: boolean
  readMessages?: boolean
  readStatus?: boolean
  syncFullHistory?: boolean
}

export interface InstanceResponse {
  instance: {
    instanceName: string
    instanceId: string
    status: string
    serverUrl: string
    apikey: string
  }
  hash?: {
    apikey: string
  }
  settings?: Record<string, unknown>
}

export interface QRCodeResponse {
  pairingCode?: string
  code?: string
  base64?: string
  count?: number
}

export type ConnectionState = 'open' | 'close' | 'connecting'

export interface ConnectionStatus {
  instance: string
  state: ConnectionState
}

// ==================== Message Types ====================

export interface SendTextDTO {
  number: string
  text: string
  delay?: number
  linkPreview?: boolean
}

export interface SendMediaDTO {
  number: string
  mediatype: 'image' | 'video' | 'audio' | 'document'
  mimetype: string
  media: string // URL or base64
  caption?: string
  fileName?: string
}

export interface MessageKey {
  remoteJid: string
  fromMe: boolean
  id: string
}

export interface MessageResponse {
  key: MessageKey
  message: Record<string, unknown>
  messageTimestamp: string
  status: string
}

// ==================== Webhook Types ====================

export interface WebhookConfig {
  url: string
  webhookByEvents?: boolean
  webhookBase64?: boolean
  events?: WebhookEvent[]
}

export type WebhookEvent =
  | 'APPLICATION_STARTUP'
  | 'QRCODE_UPDATED'
  | 'MESSAGES_SET'
  | 'MESSAGES_UPSERT'
  | 'MESSAGES_UPDATE'
  | 'MESSAGES_DELETE'
  | 'SEND_MESSAGE'
  | 'CONTACTS_SET'
  | 'CONTACTS_UPSERT'
  | 'CONTACTS_UPDATE'
  | 'PRESENCE_UPDATE'
  | 'CHATS_SET'
  | 'CHATS_UPSERT'
  | 'CHATS_UPDATE'
  | 'CHATS_DELETE'
  | 'GROUPS_UPSERT'
  | 'GROUPS_UPDATE'
  | 'GROUP_PARTICIPANTS_UPDATE'
  | 'CONNECTION_UPDATE'
  | 'CALL'
  | 'NEW_JWT_TOKEN'

// ==================== Error Types ====================

export interface EvolutionAPIError {
  status: number
  error: string
  message: string | string[]
}

// ==================== Service Options ====================

export interface SendOptions {
  delay?: number
  presence?: 'composing' | 'recording'
  linkPreview?: boolean
}

export interface MediaConfig {
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  caption?: string
  fileName?: string
  mimetype?: string
}
