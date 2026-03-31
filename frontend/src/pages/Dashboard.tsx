export function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Total de Leads</p>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Novos Leads (7d)</p>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
          <p className="text-3xl font-bold mt-2">0%</p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Mensagens Enviadas</p>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
      </div>
      <p className="mt-8 text-muted-foreground">
        Configure seu WhatsApp e comece a rastrear seus leads.
      </p>
    </div>
  )
}
