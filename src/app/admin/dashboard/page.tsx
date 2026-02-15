import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, Activity, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Visão geral do sistema e métricas chave.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-green-600">Sistema Online</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
              Total Revenue (MRR)
            </CardTitle>
            <DollarSign className="text-primary h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-3xl font-black">R$ 45.231,89</div>
            <p className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
              Active Tenants
            </CardTitle>
            <Users className="text-primary h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-3xl font-black">+2350</div>
            <p className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
              +180 new this month
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
              Active Now
            </CardTitle>
            <Activity className="text-primary h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-3xl font-black">+573</div>
            <p className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">
              +201 since last hour
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
              Issues Detected
            </CardTitle>
            <ShieldAlert className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">3</div>
            <p className="mt-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="glass-card col-span-4 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="text-muted-foreground border-primary/10 bg-primary/5 m-4 flex h-[250px] items-center justify-center rounded-xl border-2 border-dashed">
              Chart Component Placeholder
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card col-span-3 border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Recent Sales</CardTitle>
              <span className="bg-primary/10 text-primary rounded-lg px-2 py-1 text-xs font-medium">
                Last 24h
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              You made <span className="text-foreground font-bold">265 sales</span> this month.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-8 pr-4">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div
                  key={i}
                  className="group hover:bg-muted/50 flex cursor-pointer items-center rounded-lg p-2 transition-colors"
                >
                  <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full font-bold transition-transform group-hover:scale-110">
                    OM
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-foreground text-sm leading-none font-bold">Olivia Martin</p>
                    <p className="text-muted-foreground text-xs">olivia.martin@email.com</p>
                  </div>
                  <div className="text-foreground ml-auto font-bold">+$1,999.00</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
