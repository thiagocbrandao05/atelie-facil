import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, Activity, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Visão geral do sistema e métricas chave.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium text-green-600">Sistema Online</span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Revenue (MRR)</CardTitle>
                        <DollarSign className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-foreground">R$ 45.231,89</div>
                        <p className="text-xs text-emerald-600 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active Tenants</CardTitle>
                        <Users className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-foreground">+2350</div>
                        <p className="text-xs text-emerald-600 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">+180 new this month</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active Now</CardTitle>
                        <Activity className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-foreground">+573</div>
                        <p className="text-xs text-blue-600 font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded-full inline-block">+201 since last hour</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Issues Detected</CardTitle>
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-red-600">3</div>
                        <p className="text-xs text-red-600 font-bold mt-1 bg-red-50 px-2 py-0.5 rounded-full inline-block">Requires attention</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 glass-card border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground border-2 border-dashed border-primary/10 bg-primary/5 rounded-xl m-4">
                            Chart Component Placeholder
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 glass-card border-none shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-bold">Recent Sales</CardTitle>
                            <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-lg">Last 24h</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            You made <span className="font-bold text-foreground">265 sales</span> this month.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8 pr-4">
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <div key={i} className="flex items-center group cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:scale-110 transition-transform">
                                        OM
                                    </div>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-bold leading-none text-foreground">Olivia Martin</p>
                                        <p className="text-xs text-muted-foreground">olivia.martin@email.com</p>
                                    </div>
                                    <div className="ml-auto font-bold text-foreground">+$1,999.00</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
