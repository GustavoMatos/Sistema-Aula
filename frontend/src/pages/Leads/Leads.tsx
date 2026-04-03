import { useState, useCallback } from 'react'
import { Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeadsTable } from '@/components/leads/LeadsTable'
import { LeadFilters } from '@/components/leads/LeadFilters'
import { BulkActionsBar } from '@/components/leads/BulkActionsBar'
import { Pagination } from '@/components/leads/Pagination'
import { LeadFormModal } from '@/components/leads/LeadFormModal'
import { ImportCSVModal } from '@/components/leads/ImportCSVModal'
import { useLeads } from '@/hooks/useLeads'
import type { LeadFilters as LeadFiltersType } from '@/lib/api'

export function Leads() {
  const [filters, setFilters] = useState<LeadFiltersType>({
    page: 1,
    limit: 20,
    sort: 'created_at',
    order: 'desc',
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const { data, isLoading, error } = useLeads(filters)

  const handleFilterChange = useCallback((newFilters: LeadFiltersType) => {
    setFilters(newFilters)
    setSelectedIds([])
  }, [])

  const handleSort = useCallback(
    (column: string) => {
      const newOrder =
        filters.sort === column && filters.order === 'asc' ? 'desc' : 'asc'
      setFilters({
        ...filters,
        sort: column as LeadFiltersType['sort'],
        order: newOrder,
      })
    },
    [filters]
  )

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    if (!data?.leads) return
    if (selectedIds.length === data.leads.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(data.leads.map((lead) => lead.id))
    }
  }, [data?.leads, selectedIds.length])

  const handlePageChange = useCallback(
    (page: number) => {
      setFilters({ ...filters, page })
      setSelectedIds([])
    },
    [filters]
  )

  const handleLimitChange = useCallback(
    (limit: number) => {
      setFilters({ ...filters, limit, page: 1 })
      setSelectedIds([])
    },
    [filters]
  )

  const handleClearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Erro ao carregar leads: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500">Gerencie seus leads e contatos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      <LeadFormModal open={isFormOpen} onOpenChange={setIsFormOpen} />
      <ImportCSVModal open={isImportOpen} onOpenChange={setIsImportOpen} />

      <LeadFilters filters={filters} onFilterChange={handleFilterChange} />

      <BulkActionsBar
        selectedIds={selectedIds}
        onClearSelection={handleClearSelection}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <LeadsTable
            leads={data?.leads || []}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            sort={filters.sort}
            order={filters.order}
            onSort={handleSort}
          />

          {data && data.totalPages > 0 && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              limit={data.limit}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          )}
        </>
      )}
    </div>
  )
}
