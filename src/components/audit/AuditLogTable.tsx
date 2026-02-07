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
    CREATE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    LOGIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    LOGIN_FAILED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    EXPORT: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
    BACKUP: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
}

const statusColors: Record<string, string> = {
    SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    PARTIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
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


