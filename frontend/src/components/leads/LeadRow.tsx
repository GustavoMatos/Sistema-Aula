import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TableCell, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import type { Lead } from '@/lib/api'

interface LeadRowProps {
  lead: Lead
  selected: boolean
  onSelect: () => void
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const ddd = cleaned.slice(2, 4)
    const firstPart = cleaned.slice(4, 9)
    const secondPart = cleaned.slice(9)
    return `(${ddd}) ${firstPart}-${secondPart}`
  }
  if (cleaned.length === 11) {
    const ddd = cleaned.slice(0, 2)
    const firstPart = cleaned.slice(2, 7)
    const secondPart = cleaned.slice(7)
    return `(${ddd}) ${firstPart}-${secondPart}`
  }
  return phone
}

function formatLastContact(date: string | null): string {
  if (!date) return '-'
  return formatDistanceToNow(new Date(date), { addSuffix: false, locale: ptBR })
}

export function LeadRow({ lead, selected, onSelect }: LeadRowProps) {
  const navigate = useNavigate()

  const handleRowClick = () => {
    navigate(`/leads/${lead.id}`)
  }

  return (
    <TableRow
      className="cursor-pointer hover:bg-gray-50"
      onClick={handleRowClick}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell className="font-medium">{lead.name}</TableCell>
      <TableCell className="text-gray-600">{formatPhone(lead.phone)}</TableCell>
      <TableCell>
        {lead.kanban_stages && (
          <Badge
            variant="outline"
            style={{
              borderColor: lead.kanban_stages.color,
              color: lead.kanban_stages.color,
            }}
          >
            <span
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: lead.kanban_stages.color }}
            />
            {lead.kanban_stages.name}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-gray-600">{lead.source || '-'}</TableCell>
      <TableCell className="text-gray-600">
        {formatLastContact(lead.last_contact_at)}
      </TableCell>
    </TableRow>
  )
}
