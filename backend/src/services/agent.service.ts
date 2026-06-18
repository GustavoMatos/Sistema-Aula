import { config } from '../config/index.js'
import { BadRequestError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

const KESTRA_NAMESPACE = 'leadtracker.ai'
const KESTRA_FLOW_ID = 'conversational-agent'

interface KestrarExecutionResponse {
  id: string
  state: { current: string }
  taskRunList?: Array<{
    taskId: string
    outputs?: {
      textOutput?: string
    }
  }>
}

interface AgentResponse {
  message: string
  executionId: string
}

class AgentService {
  private getAuthHeader(): string {
    if (config.kestra.username && config.kestra.password) {
      return `Basic ${Buffer.from(`${config.kestra.username}:${config.kestra.password}`).toString('base64')}`
    }
    return ''
  }

  private getBaseUrl(): string {
    if (!config.kestra.url) {
      throw new BadRequestError('Kestra não está configurado. Preencha KESTRA_URL no .env')
    }
    return config.kestra.url.replace(/\/$/, '')
  }

  /**
   * Send a message to the AI agent via Kestra
   */
  async chat(
    userMessage: string,
    sessionId: string,
    tenantId: string,
    userId: string
  ): Promise<AgentResponse> {
    const baseUrl = this.getBaseUrl()

    // Trigger the Kestra flow execution via multipart form
    const executeUrl = `${baseUrl}/api/v1/executions/${KESTRA_NAMESPACE}/${KESTRA_FLOW_ID}`

    logger.info('Triggering Kestra agent flow', { sessionId, tenantId })

    const formData = new FormData()
    formData.append('user_message', userMessage)
    formData.append('session_id', sessionId)
    formData.append('tenant_id', tenantId)
    formData.append('user_id', userId)
    formData.append('api_key', config.kestra.aiApiKey)

    const headers: HeadersInit = {}
    const auth = this.getAuthHeader()
    if (auth) headers['Authorization'] = auth

    const response = await fetch(executeUrl, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Kestra execution failed', { status: response.status, error: errorText })
      throw new BadRequestError('Falha ao executar o agente. Tente novamente.')
    }

    const execution: KestrarExecutionResponse = await response.json()
    const executionId = execution.id

    // Poll for completion (max 60 seconds)
    const agentOutput = await this.waitForCompletion(executionId)

    return {
      message: agentOutput,
      executionId,
    }
  }

  /**
   * Poll Kestra execution until completion
   */
  private async waitForCompletion(executionId: string, maxWaitMs = 60000): Promise<string> {
    const baseUrl = this.getBaseUrl()
    const pollUrl = `${baseUrl}/api/v1/executions/${executionId}`
    const pollInterval = 1000
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))

      const pollHeaders: HeadersInit = {}
      const pollAuth = this.getAuthHeader()
      if (pollAuth) pollHeaders['Authorization'] = pollAuth

      const response = await fetch(pollUrl, {
        headers: pollHeaders,
      })

      if (!response.ok) {
        logger.error('Failed to poll Kestra execution', { executionId, status: response.status })
        throw new BadRequestError('Erro ao consultar status do agente')
      }

      const execution: KestrarExecutionResponse = await response.json()
      const state = execution.state.current

      if (state === 'SUCCESS') {
        const taskRun = execution.taskRunList?.find(t => t.taskId === 'agent_task')
        return taskRun?.outputs?.textOutput || 'Resposta do agente não disponível.'
      }

      if (state === 'FAILED' || state === 'KILLED') {
        logger.error('Kestra execution failed', { executionId, state })
        throw new BadRequestError('O agente encontrou um erro ao processar sua mensagem.')
      }

      // RUNNING, CREATED, etc. — keep polling
    }

    throw new BadRequestError('Tempo limite excedido. O agente demorou muito para responder.')
  }

  /**
   * Check if Kestra is configured and reachable
   */
  async healthCheck(): Promise<{ configured: boolean; reachable: boolean }> {
    if (!config.kestra.url) {
      return { configured: false, reachable: false }
    }

    try {
      const baseUrl = this.getBaseUrl()
      const healthHeaders: HeadersInit = {}
      const healthAuth = this.getAuthHeader()
      if (healthAuth) healthHeaders['Authorization'] = healthAuth

      const response = await fetch(`${baseUrl}/api/v1/flows`, {
        headers: healthHeaders,
      })
      return { configured: true, reachable: response.ok }
    } catch {
      return { configured: true, reachable: false }
    }
  }
}

export const agentService = new AgentService()
