import { parse } from 'csv-parse/sync'
import { supabase } from '../config/supabase.js'
import { BadRequestError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'
import { leadHistoryService } from './lead-history.service.js'

export interface ImportError {
  row: number
  field: string
  error: string
}

export interface ImportResult {
  imported: number
  duplicates: number
  errors: ImportError[]
  total_rows: number
}

interface CSVRecord {
  name?: string
  phone?: string
  email?: string
  company?: string
  source?: string
  tags?: string
  notes?: string
  potential_value?: string
}

const MAX_LEADS_PER_IMPORT = 1000

class ImportService {
  /**
   * Import leads from CSV file
   */
  async importCSV(
    workspaceId: string,
    userId: string,
    file: Express.Multer.File
  ): Promise<ImportResult> {
    // Parse CSV content
    const content = file.buffer.toString('utf-8')
    let records: CSVRecord[]

    try {
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      })
    } catch (error) {
      logger.error('Failed to parse CSV', { error })
      throw new BadRequestError('Formato de CSV inválido')
    }

    if (records.length === 0) {
      throw new BadRequestError('Arquivo CSV vazio')
    }

    if (records.length > MAX_LEADS_PER_IMPORT) {
      throw new BadRequestError(`Máximo de ${MAX_LEADS_PER_IMPORT} leads por importação`)
    }

    // Get first stage for workspace
    const { data: firstStage, error: stageError } = await supabase
      .from('kanban_stages')
      .select('id')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true })
      .limit(1)
      .single()

    if (stageError || !firstStage) {
      throw new BadRequestError('Nenhum estágio configurado para o workspace')
    }

    // Get existing phones in workspace
    const phones = records
      .map((r) => this.normalizePhone(r.phone))
      .filter((p): p is string => !!p)

    const { data: existing } = await supabase
      .from('leads')
      .select('phone')
      .eq('workspace_id', workspaceId)
      .in('phone', phones)

    const existingPhones = new Set(existing?.map((e) => e.phone) || [])

    const result: ImportResult = {
      imported: 0,
      duplicates: 0,
      errors: [],
      total_rows: records.length,
    }

    const toInsert: Array<{
      workspace_id: string
      stage_id: string
      name: string
      phone: string
      email: string | null
      company: string | null
      source: string | null
      tags: string[]
      notes: string | null
      potential_value: number | null
    }> = []

    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const rowNum = i + 2 // +2 because line 1 is header

      // Validate name
      if (!row.name?.trim()) {
        result.errors.push({
          row: rowNum,
          field: 'name',
          error: 'Nome é obrigatório',
        })
        continue
      }

      // Validate phone
      const phone = this.normalizePhone(row.phone)
      if (!phone) {
        result.errors.push({
          row: rowNum,
          field: 'phone',
          error: `Telefone inválido: ${row.phone || '(vazio)'}`,
        })
        continue
      }

      // Check for duplicates
      if (existingPhones.has(phone)) {
        result.duplicates++
        continue
      }

      // Add to set to avoid duplicates within same file
      existingPhones.add(phone)

      // Parse tags if provided
      const tags = row.tags
        ? row.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : []

      // Parse potential value
      const potentialValue = row.potential_value
        ? parseFloat(row.potential_value.replace(/[^\d.]/g, ''))
        : null

      toInsert.push({
        workspace_id: workspaceId,
        stage_id: firstStage.id,
        name: row.name.trim(),
        phone,
        email: row.email?.trim() || null,
        company: row.company?.trim() || null,
        source: row.source?.trim() || 'importação',
        tags,
        notes: row.notes?.trim() || null,
        potential_value: potentialValue && !isNaN(potentialValue) ? potentialValue : null,
      })
    }

    // Insert in batches
    if (toInsert.length > 0) {
      const BATCH_SIZE = 100
      for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        const batch = toInsert.slice(i, i + BATCH_SIZE)
        const { data: insertedLeads, error } = await supabase
          .from('leads')
          .insert(batch)
          .select('id')

        if (error) {
          logger.error('Failed to insert leads batch', { error, batchIndex: i })
          throw new BadRequestError('Erro ao inserir leads')
        }

        // Record history for each imported lead
        if (insertedLeads) {
          for (const lead of insertedLeads) {
            await leadHistoryService.record({
              lead_id: lead.id,
              action: 'lead_created',
              to_stage_id: firstStage.id,
              metadata: { source: 'importação', import_batch: true },
              user_id: userId,
            })
          }
        }
      }

      result.imported = toInsert.length
    }

    logger.info(`CSV import completed`, {
      workspaceId,
      userId,
      imported: result.imported,
      duplicates: result.duplicates,
      errors: result.errors.length,
    })

    return result
  }

  /**
   * Normalize phone number (remove non-digits, validate length)
   */
  private normalizePhone(phone?: string): string | null {
    if (!phone) return null

    const cleaned = phone.replace(/\D/g, '')

    // Valid phone: 10-15 digits (international format)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return null
    }

    return cleaned
  }
}

export const importService = new ImportService()
