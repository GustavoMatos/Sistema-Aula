import { apiClient } from './client'

interface AgentChatResponse {
  response: string
  session_id: string
  execution_id: string
}

interface AgentHealthResponse {
  configured: boolean
  reachable: boolean
}

export const agentApi = {
  chat: (message: string, sessionId?: string) =>
    apiClient.post<AgentChatResponse>('/api/agent/chat', {
      message,
      session_id: sessionId,
    }),

  health: () => apiClient.get<AgentHealthResponse>('/api/agent/health'),
}
