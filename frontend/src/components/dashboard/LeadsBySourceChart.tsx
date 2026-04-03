import type { JSX } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LeadsBySourceChartProps {
  data: { source: string; count: number }[]
}

const SOURCE_COLORS: Record<string, string> = {
  whatsapp: '#25D366',
  manual: '#3B82F6',
  import: '#8B5CF6',
  website: '#F59E0B',
  facebook: '#1877F2',
  instagram: '#E4405F',
  google: '#EA4335',
  indicacao: '#10B981',
  Desconhecido: '#6B7280',
}

export function LeadsBySourceChart({ data }: LeadsBySourceChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads por Origem</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">Nenhum dado disponivel</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads por Origem</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Donut-style display */}
        <div className="flex items-center gap-6">
          {/* Simple visual representation */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              {data.reduce(
                (acc, item, index) => {
                  const percentage = total > 0 ? (item.count / total) * 100 : 0
                  const offset = acc.offset
                  const color = SOURCE_COLORS[item.source] || '#6B7280'

                  acc.paths.push(
                    <circle
                      key={index}
                      cx="18"
                      cy="18"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke={color}
                      strokeWidth="3"
                      strokeDasharray={`${percentage} ${100 - percentage}`}
                      strokeDashoffset={-offset}
                      className="transition-all duration-500"
                    />
                  )

                  acc.offset += percentage
                  return acc
                },
                { paths: [] as JSX.Element[], offset: 25 }
              ).paths}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {data.map((item) => {
              const color = SOURCE_COLORS[item.source] || '#6B7280'
              const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
              return (
                <div
                  key={item.source}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {item.source}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {item.count} ({percentage}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
