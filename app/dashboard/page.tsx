export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Total Projects</div>
          <div className="text-2xl font-bold">12</div>
        </div>
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-card-foreground shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">API Calls</div>
          <div className="text-2xl font-bold">24.5k</div>
        </div>
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Active Keys</div>
          <div className="text-2xl font-bold">3</div>
        </div>
      </div>
    </div>
  );
}
