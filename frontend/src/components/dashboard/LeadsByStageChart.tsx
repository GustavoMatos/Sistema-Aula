import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LeadsByStageChartProps {
  data: { stage: string; color: string; count: number }[]
}

export function LeadsByStageChart({ data }: LeadsByStageChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads por Estagio</CardTitle>
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
        <CardTitle>Leads por Estagio</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress bars */}
        <div className="space-y-4">
          {data.map((item) => {
            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
            return (
              <div key={item.stage}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {item.stage}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {item.count} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-lg font-bold text-gray-900">{total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
