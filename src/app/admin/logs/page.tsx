import { getSystemLogs } from '@/features/admin/actions'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function LogsPage() {
    const logs = await getSystemLogs()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Logs</h1>
                <p className="text-slate-500">Auditoria e histórico de ações relevantes.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Últimos Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data/Hora</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Tenant</TableHead>
                                <TableHead>Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log: any) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap font-mono text-xs text-slate-500">
                                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            log.action.includes('DELETE') ? 'border-red-500 text-red-600 bg-red-50' :
                                                log.action.includes('UPDATE') ? 'border-blue-500 text-blue-600 bg-blue-50' :
                                                    'border-slate-400 text-slate-600'
                                        }>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{log.user?.name || 'Sistema'}</span>
                                            <span className="text-xs text-slate-400">{log.user?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {log.tenant?.name || '-'}
                                    </TableCell>
                                    <TableCell className="max-w-md truncate text-xs text-slate-500" title={JSON.stringify(log.details, null, 2)}>
                                        {log.entity} {log.entityId ? `#${log.entityId.substring(0, 8)}` : ''}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {logs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        Nenhum log registrado recentemente.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
