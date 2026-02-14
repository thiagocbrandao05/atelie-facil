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
            <div className="bg-info/10 rounded-lg p-2">
              <FileText className="text-info h-6 w-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total de Registros</p>
              <p className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="bg-success/10 rounded-lg p-2">
              <Activity className="text-success h-6 w-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Últimas 24h</p>
              <p className="text-2xl font-bold">{stats.recentActivity.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-lg p-2">
              <Shield className="text-primary h-6 w-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Tipos de Ação</p>
              <p className="text-2xl font-bold">{stats.actionBreakdown.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
