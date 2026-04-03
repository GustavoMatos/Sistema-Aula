import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useKanbanStages } from '@/hooks/useKanbanStages'
import type { LeadFilters as LeadFiltersType } from '@/lib/api'

interface LeadFiltersProps {
  filters: LeadFiltersType
  onFilterChange: (filters: LeadFiltersType) => void
}

const LEAD_SOURCES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: 'Website' },
  { value: 'indicacao', label: 'Indicacao' },
  { value: 'outro', label: 'Outro' },
]

export function LeadFilters({ filters, onFilterChange }: LeadFiltersProps) {
  const { data: stages } = useKanbanStages()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value || undefined, page: 1 })
  }

  const handleStageChange = (value: string) => {
    onFilterChange({
      ...filters,
      stage_id: value === 'all' ? undefined : value,
      page: 1,
    })
  }

  const handleSourceChange = (value: string) => {
    onFilterChange({
      ...filters,
      source: value === 'all' ? undefined : value,
      page: 1,
    })
  }

  const clearFilters = () => {
    onFilterChange({
      page: 1,
      limit: filters.limit,
    })
  }

  const hasActiveFilters =
    filters.search || filters.stage_id || filters.source

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          value={filters.search || ''}
          onChange={handleSearchChange}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.stage_id || 'all'}
        onValueChange={handleStageChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Estagio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os estagios</SelectItem>
          {stages?.map((stage) => (
            <SelectItem key={stage.id} value={stage.id}>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                {stage.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.source || 'all'}
        onValueChange={handleSourceChange}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas origens</SelectItem>
          {LEAD_SOURCES.map((source) => (
            <SelectItem key={source.value} value={source.value}>
              {source.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-gray-500"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
