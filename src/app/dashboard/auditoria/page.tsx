import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAuditLogs, getAuditStats } from '@/features/audits/actions'
import { AuditStats } from '@/components/audit/AuditStats'

// Dynamic import for heavy component
const AuditLogTable = dynamic(() => import('@/components/audit/AuditLogTable').then(mod => ({ default: mod.AuditLogTable })), {
    loading: () => <div className="text-center py-8">Carregando tabela...</div>,
    ssr: true
})

export const metadata = {
    title: 'Auditoria | AteliêFácil',
    description: 'Histórico de ações e auditoria do sistema'
}

export default async function AuditoriaPage({
    searchParams
}: {
    searchParams: { page?: string; action?: string; entity?: string }
}) {
    const page = Number(searchParams.page) || 1
    const filters = {
        action: searchParams.action as any,
        entity: searchParams.entity
    }

    const [logsData, stats] = await Promise.all([
        getAuditLogs(page, 50, filters),
        getAuditStats()
    ])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Auditoria</h1>
                <p className="text-muted-foreground mt-2">
                    Histórico completo de ações realizadas no sistema
                </p>
            </div>

            {stats && (
                <Suspense fallback={<div>Carregando estatísticas...</div>}>
                    <AuditStats stats={stats} />
                </Suspense>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Registro de Atividades</CardTitle>
                    <CardDescription>
                        Visualize todas as ações realizadas pelos usuários
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Carregando logs...</div>}>
                        <AuditLogTable data={logsData} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}


