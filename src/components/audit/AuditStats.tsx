'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Activity, FileText, Shield } from 'lucide-react'

interface AuditStatsProps {
    stats: {
        totalLogs: number
        recentActivity: number
        actionBreakdown: Array<{ action: string; count: number }>
    }
}

export function AuditStats({ stats }: AuditStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-info/10 rounded-lg">
                            <FileText className="h-6 w-6 text-info" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Registros</p>
                            <p className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-success/10 rounded-lg">
                            <Activity className="h-6 w-6 text-success" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Últimas 24h</p>
                            <p className="text-2xl font-bold">{stats.recentActivity.toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Tipos de Ação</p>
                            <p className="text-2xl font-bold">{stats.actionBreakdown.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

