import axios, { AxiosInstance, AxiosError } from 'axios'
import { config } from '../../config/index.js'
import { logger } from '../../utils/logger.js'
import { withRetry, formatPhoneNumber, getMimeType, getMediaType } from './evolution.utils.js'
import {
  InstanceConfig,
  InstanceResponse,
  QRCodeResponse,
  ConnectionStatus,
  MessageResponse,
  WebhookConfig,
  SendOptions,
  MediaConfig,
  EvolutionAPIError,
} from './evolution.types.js'

export class EvolutionService {
  private client: AxiosInstance
  private globalApiKey: string

  constructor() {
    const baseURL = config.evolution.url

    if (!baseURL) {
      logger.warn('Evolution API URL not configured')
    }

    this.globalApiKey = config.evolution.apiKey

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor for logging
    this.client.interceptors.request.use((request) => {
      logger.debug(`Evolution API Request: ${request.method?.toUpperCase()} ${request.url}`)
      return request
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<EvolutionAPIError>) => {
        const message = error.response?.data?.message || error.message
        logger.error(`Evolution API Error: ${message}`, {
          status: error.response?.status,
          url: error.config?.url,
        })
        throw error
      }
    )
  }

  /**
   * Create a new WhatsApp instance
   */
  async createInstance(
    instanceName: string,
    instanceConfig: InstanceConfig = {}
  ): Promise<InstanceResponse> {
    logger.info(`Creating Evolution instance: ${instanceName}`)

    return withRetry(async () => {
      const response = await this.client.post<InstanceResponse>(
        '/instance/create',
        {
          instanceName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
          rejectCall: instanceConfig.rejectCall ?? false,
          groupsIgnore: instanceConfig.groupsIgnore ?? true,
          alwaysOnline: instanceConfig.alwaysOnline ?? false,
          readMessages: instanceConfig.readMessages ?? true,
          readStatus: instanceConfig.readStatus ?? false,
          syncFullHistory: instanceConfig.syncFullHistory ?? false,
        },
        {
          headers: { apikey: this.globalApiKey },
        }
      )

      logger.info(`Instance created successfully: ${instanceName}`, {
        instanceId: response.data.instance?.instanceId,
      })

      return response.data
    })
  }

  /**
   * Get QR Code for instance connection
   */
  async getQRCode(instanceName: string, instanceApiKey?: string): Promise<QRCodeResponse> {
    logger.info(`Fetching QR Code for instance: ${instanceName}`)

    return withRetry(async () => {
      const response = await this.client.get<QRCodeResponse>(
        `/instance/connect/${instanceName}`,
        {
          headers: { apikey: instanceApiKey || this.globalApiKey },
        }
      )

      logger.debug(`QR Code fetched for: ${instanceName}`, {
        hasCode: !!response.data.code,
        hasPairingCode: !!response.data.pairingCode,
      })

      return response.data
    })
  }

  /**
   * Get connection status of an instance
   */
  async getConnectionStatus(
    instanceName: string,
    instanceApiKey?: string
  ): Promise<ConnectionStatus> {
    logger.debug(`Checking connection status for: ${instanceName}`)

    const response = await this.client.get<{ instance: ConnectionStatus }>(
      `/instance/connectionState/${instanceName}`,
      {
        headers: { apikey: instanceApiKey || this.globalApiKey },
      }
    )

    const status: ConnectionStatus = {
      instance: instanceName,
      state: response.data.instance?.state || 'close',
    }

    logger.debug(`Connection status for ${instanceName}: ${status.state}`)

    return status
  }

  /**
   * Send a text message
   */
  async sendText(
    instanceName: string,
    number: string,
    text: string,
    options: SendOptions = {},
    instanceApiKey?: string
  ): Promise<MessageResponse> {
    const formattedNumber = formatPhoneNumber(number)

    logger.info(`Sending text message via ${instanceName} to ${formattedNumber}`)

    return withRetry(async () => {
      const response = await this.client.post<MessageResponse>(
        `/message/sendText/${instanceName}`,
        {
          number: formattedNumber,
          text,
          delay: options.delay || 1000,
          linkPreview: options.linkPreview ?? true,
        },
        {
          headers: { apikey: instanceApiKey || this.globalApiKey },
        }
      )

      logger.info(`Message sent successfully`, {
        instance: instanceName,
        to: formattedNumber,
        messageId: response.data.key?.id,
      })

      return response.data
    })
  }

  /**
   * Send media message (image, video, audio, document)
   */
  async sendMedia(
    instanceName: string,
    number: string,
    media: MediaConfig,
    instanceApiKey?: string
  ): Promise<MessageResponse> {
    const formattedNumber = formatPhoneNumber(number)
    const mimetype = media.mimetype || getMimeType(media.url)
    const mediatype = media.type || getMediaType(mimetype)

    logger.info(`Sending ${mediatype} via ${instanceName} to ${formattedNumber}`)

    return withRetry(async () => {
      const response = await this.client.post<MessageResponse>(
        `/message/sendMedia/${instanceName}`,
        {
          number: formattedNumber,
          mediatype,
          mimetype,
          media: media.url,
          caption: media.caption,
          fileName: media.fileName,
        },
        {
          headers: { apikey: instanceApiKey || this.globalApiKey },
        }
      )

      logger.info(`Media sent successfully`, {
        instance: instanceName,
        to: formattedNumber,
        type: mediatype,
        messageId: response.data.key?.id,
      })

      return response.data
    })
  }

  /**
   * Configure webhook for an instance
   */
  async setWebhook(
    instanceName: string,
    webhookConfig: WebhookConfig,
    instanceApiKey?: string
  ): Promise<void> {
    logger.info(`Setting webhook for instance: ${instanceName}`, {
      url: webhookConfig.url,
      events: webhookConfig.events,
    })

    await this.client.post(
      `/webhook/set/${instanceName}`,
      {
        url: webhookConfig.url,
        enabled: true,
        webhookByEvents: webhookConfig.webhookByEvents ?? true,
        webhookBase64: webhookConfig.webhookBase64 ?? false,
        events: webhookConfig.events || [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED',
        ],
      },
      {
        headers: { apikey: instanceApiKey || this.globalApiKey },
      }
    )

    logger.info(`Webhook configured for: ${instanceName}`)
  }

  /**
   * Logout from an instance (disconnect WhatsApp)
   */
  async logout(instanceName: string, instanceApiKey?: string): Promise<void> {
    logger.info(`Logging out instance: ${instanceName}`)

    await this.client.delete(`/instance/logout/${instanceName}`, {
      headers: { apikey: instanceApiKey || this.globalApiKey },
    })

    logger.info(`Instance logged out: ${instanceName}`)
  }

  /**
   * Delete an instance permanently
   */
  async deleteInstance(instanceName: string, instanceApiKey?: string): Promise<void> {
    logger.info(`Deleting instance: ${instanceName}`)

    await this.client.delete(`/instance/delete/${instanceName}`, {
      headers: { apikey: instanceApiKey || this.globalApiKey },
    })

    logger.info(`Instance deleted: ${instanceName}`)
  }

  /**
   * Fetch all instances (requires global API key)
   */
  async fetchInstances(): Promise<InstanceResponse[]> {
    logger.debug('Fetching all Evolution instances')

    const response = await this.client.get<InstanceResponse[]>('/instance/fetchInstances', {
      headers: { apikey: this.globalApiKey },
    })

    return response.data
  }

  /**
   * Check if Evolution API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/instance/fetchInstances', {
        headers: { apikey: this.globalApiKey },
        timeout: 5000,
      })
      return true
    } catch {
      return false
    }
  }
}

// Singleton instance
export const evolutionService = new EvolutionService()
