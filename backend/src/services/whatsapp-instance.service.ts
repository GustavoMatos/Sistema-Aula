import { supabase } from '../config/supabase.js'
import { logger } from '../utils/logger.js'
import { NotFoundError } from '../utils/errors.js'

export interface WhatsAppInstance {
  id: string
  workspace_id: string
  instance_name: string
  api_key: string | null
  api_url: string | null
  status: 'connected' | 'disconnected' | 'connecting'
  phone_number: string | null
  qr_code: string | null
  created_at: string
  updated_at: string
}

export interface CreateInstanceDTO {
  workspace_id: string
  instance_name: string
  api_key?: string
  api_url?: string
}

export interface UpdateInstanceDTO {
  status?: 'connected' | 'disconnected' | 'connecting'
  phone_number?: string
  qr_code?: string | null
  api_key?: string
}

class WhatsAppInstanceService {
  /**
   * Create a new WhatsApp instance record
   */
  async create(data: CreateInstanceDTO): Promise<WhatsAppInstance> {
    logger.info(`Creating WhatsApp instance record: ${data.instance_name}`)

    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .insert({
        workspace_id: data.workspace_id,
        instance_name: data.instance_name,
        api_key: data.api_key,
        api_url: data.api_url,
        status: 'disconnected',
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create instance record', { error: error.message })
      throw new Error(`Failed to create instance: ${error.message}`)
    }

    logger.info(`Instance record created: ${instance.id}`)
    return instance
  }

  /**
   * Get all instances for a workspace
   */
  async findByWorkspace(workspaceId: string): Promise<WhatsAppInstance[]> {
    logger.debug(`Fetching instances for workspace: ${workspaceId}`)

    const { data: instances, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch instances', { error: error.message })
      throw new Error(`Failed to fetch instances: ${error.message}`)
    }

    return instances || []
  }

  /**
   * Get instance by ID
   */
  async findById(id: string, workspaceId?: string): Promise<WhatsAppInstance> {
    logger.debug(`Fetching instance: ${id}`)

    let query = supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', id)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data: instance, error } = await query.single()

    if (error || !instance) {
      throw new NotFoundError('Instância não encontrada')
    }

    return instance
  }

  /**
   * Get instance by name
   */
  async findByName(instanceName: string, workspaceId: string): Promise<WhatsAppInstance | null> {
    logger.debug(`Fetching instance by name: ${instanceName}`)

    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', instanceName)
      .eq('workspace_id', workspaceId)
      .single()

    if (error) {
      return null
    }

    return instance
  }

  /**
   * Update instance
   */
  async update(id: string, data: UpdateInstanceDTO): Promise<WhatsAppInstance> {
    logger.info(`Updating instance: ${id}`, { data })

    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update instance', { error: error.message })
      throw new Error(`Failed to update instance: ${error.message}`)
    }

    return instance
  }

  /**
   * Update instance status
   */
  async updateStatus(
    id: string,
    status: 'connected' | 'disconnected' | 'connecting',
    phoneNumber?: string
  ): Promise<void> {
    logger.info(`Updating instance status: ${id} -> ${status}`)

    const updateData: UpdateInstanceDTO = { status }
    if (phoneNumber) {
      updateData.phone_number = phoneNumber
    }

    await this.update(id, updateData)
  }

  /**
   * Delete instance (soft delete by removing from Evolution, then hard delete from DB)
   */
  async delete(id: string): Promise<void> {
    logger.info(`Deleting instance: ${id}`)

    const { error } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Failed to delete instance', { error: error.message })
      throw new Error(`Failed to delete instance: ${error.message}`)
    }

    logger.info(`Instance deleted: ${id}`)
  }

  /**
   * Check if instance name is available in workspace
   */
  async isNameAvailable(instanceName: string, workspaceId: string): Promise<boolean> {
    const existing = await this.findByName(instanceName, workspaceId)
    return !existing
  }
}

export const whatsappInstanceService = new WhatsAppInstanceService()
