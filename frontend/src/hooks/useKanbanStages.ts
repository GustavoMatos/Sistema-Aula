import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface KanbanStage {
  id: string
  workspace_id: string
  name: string
  color: string
  position: number
  is_final: boolean
}

export const kanbanStagesKeys = {
  all: ['kanban-stages'] as const,
  list: () => [...kanbanStagesKeys.all, 'list'] as const,
}

export function useKanbanStages() {
  return useQuery({
    queryKey: kanbanStagesKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_stages')
        .select('*')
        .order('position', { ascending: true })

      if (error) throw error
      return data as KanbanStage[]
    },
  })
}
