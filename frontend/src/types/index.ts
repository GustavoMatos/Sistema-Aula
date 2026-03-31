// Lead types
export interface Lead {
  id: string
  workspace_id: string
  stage_id: string
  name: string
  phone: string
  email?: string
  company?: string
  source?: string
  notes?: string
  status: 'active' | 'archived'
  automation_paused: boolean
  last_contact_at?: string
  created_at: string
  updated_at: string
  stage?: KanbanStage
}

// Kanban types
export interface KanbanStage {
  id: string
  workspace_id: string
  name: string
  color: string
  position: number
  is_final: boolean
  created_at: string
}

// WhatsApp types
export interface WhatsAppInstance {
  id: string
  workspace_id: string
  name: string
  status: 'connected' | 'disconnected' | 'connecting' | 'awaiting_scan'
  phone_number?: string
  qr_code?: string
  webhook_secret?: string
  last_connected_at?: string
  created_at: string
}

// Message types
export interface Message {
  id: string
  lead_id: string
  instance_id?: string
  direction: 'inbound' | 'outbound'
  content: string
  media_url?: string
  message_id?: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  is_automated: boolean
  sent_at?: string
  created_at: string
}

// Follow-up types
export interface FollowupConfig {
  id: string
  workspace_id: string
  stage_id: string
  name: string
  delay_minutes: number
  message_type: 'text' | 'image'
  message_template: string
  image_url?: string
  is_active: boolean
  position: number
  send_hour_start: number
  send_hour_end: number
  created_at: string
}

// Workspace types
export interface Workspace {
  id: string
  name: string
  created_at: string
}

export interface User {
  id: string
  email: string
  workspace_id: string
  role: 'admin' | 'user'
  created_at: string
}
