import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { LeadRow } from './LeadRow'
import type { Lead } from '@/lib/api'

interface LeadsTableProps {
  leads: Lead[]
  selectedIds: string[]
  onSelect: (id: string) => void
  onSelectAll: () => void
  sort?: string
  order?: 'asc' | 'desc'
  onSort: (column: string) => void
}

type SortableColumn = 'name' | 'created_at' | 'last_contact_at'

export function LeadsTable({
  leads,
  selectedIds,
  onSelect,
  onSelectAll,
  sort,
  order,
  onSort,
}: LeadsTableProps) {
  const allSelected = leads.length > 0 && selectedIds.length === leads.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < leads.length

  const renderSortIcon = (column: SortableColumn) => {
    if (sort !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />
    }
    return order === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as unknown as HTMLInputElement).indeterminate = someSelected
                  }
                }}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => onSort('name')}
              >
                Nome
                {renderSortIcon('name')}
              </Button>
            </TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Estágio</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => onSort('last_contact_at')}
              >
                Última Interação
                {renderSortIcon('last_contact_at')}
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <td colSpan={6} className="h-24 text-center text-gray-500">
                Nenhum lead encontrado
              </td>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                selected={selectedIds.includes(lead.id)}
                onSelect={() => onSelect(lead.id)}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
