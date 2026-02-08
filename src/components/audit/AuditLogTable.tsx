'use client'

import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { PaginatedResponse } from '@/lib/types'
import type { AuditLogWithUser } from '@/features/audits/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface AuditLogTableProps {
    data: PaginatedResponse<AuditLogWithUser>
}

const actionColors: Record<string, string> = {
    CREATE: 'bg-success/10 text-success',
    UPDATE: 'bg-info/10 text-info',
    DELETE: 'bg-danger/10 text-danger',
    LOGIN: 'bg-primary/10 text-primary',
    LOGOUT: 'bg-muted/40 text-muted-foreground',
    LOGIN_FAILED: 'bg-warning/10 text-warning',
    EXPORT: 'bg-accent-soft text-accent-foreground',
    BACKUP: 'bg-secondary text-secondary-foreground',
}

const statusColors: Record<string, string> = {
    SUCCESS: 'bg-success/10 text-success',
    FAILED: 'bg-danger/10 text-danger',
    PARTIAL: 'bg-warning/10 text-warning',
}

export function AuditLogTable({ data }: AuditLogTableProps) {
    if (data.data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Nenhum registro de auditoria encontrado
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Ação</TableHead>
                            <TableHead>Entidade</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.data.map((log: any) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-mono text-sm">
                                    {formatDistanceToNow(new Date(log.createdAt), {
                                        addSuffix: true,
                                        locale: ptBR
                                    })}
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <div className="font-medium">{log.user?.name || 'Sistema'}</div>
                                        <div className="text-sm text-muted-foreground">{log.user?.email}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={actionColors[log.action] || ''}>
                                        {log.action}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <div className="font-medium">{log.entity}</div>
                                        {log.entityId && (
                                            <div className="text-sm text-muted-foreground font-mono">
                                                {log.entityId.substring(0, 8)}...
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={statusColors[log.status] || ''}>
                                        {log.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Página {data.page} de {data.totalPages} ({data.total} registros)
                    </div>
                    <div className="flex gap-2">
                        {data.page > 1 && (
                            <Link href={`?page=${data.page - 1}`}>
                                <Button variant="outline" size="sm">
                                    Anterior
                                </Button>
                            </Link>
                        )}
                        {data.page < data.totalPages && (
                            <Link href={`?page=${data.page + 1}`}>
                                <Button variant="outline" size="sm">
                                    Próxima
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

