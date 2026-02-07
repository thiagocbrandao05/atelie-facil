'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, Check, AlertCircle, Info, Package, Calendar } from 'lucide-react'
import { markAsRead, markAllAsRead } from '@/features/notifications/actions'
import { useRouter } from 'next/navigation'
import { Notification } from '@/lib/types'

interface NotificationListProps {
    notifications: Notification[]
}

const typeIcons = {
    STOCK_ALERT: Package,
    ORDER_DEADLINE: Calendar,
    ORDER_READY: Check,
    SYSTEM: AlertCircle,
    INFO: Info,
}

const typeColors = {
    STOCK_ALERT: 'text-orange-600 dark:text-orange-400',
    ORDER_DEADLINE: 'text-red-600 dark:text-red-400',
    ORDER_READY: 'text-green-600 dark:text-green-400',
    SYSTEM: 'text-blue-600 dark:text-blue-400',
    INFO: 'text-gray-600 dark:text-gray-400',
}

const priorityColors = {
    LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    NORMAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

export function NotificationList({ notifications }: NotificationListProps) {
    const router = useRouter()

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id)
        router.refresh()
    }

    const handleMarkAllAsRead = async () => {
        await markAllAsRead()
        router.refresh()
    }

    if (notifications.length === 0) {
        return (
            <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma notificação</p>
            </div>
        )
    }

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <div className="space-y-4">
            {unreadCount > 0 && (
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                        Marcar todas como lidas
                    </Button>
                </div>
            )}

            <div className="space-y-3">
                {notifications.map((notification) => {
                    const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info
                    const iconColor = typeColors[notification.type as keyof typeof typeColors] || 'text-gray-600'

                    return (
                        <div
                            key={notification.id}
                            className={`p-4 rounded-lg border transition-colors ${notification.read
                                ? 'bg-background'
                                : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${notification.read ? 'bg-muted' : 'bg-blue-100 dark:bg-blue-900'}`}>
                                    <Icon className={`h-5 w-5 ${iconColor}`} />
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-semibold">{notification.title}</h4>
                                        <Badge className={priorityColors[notification.priority]}>
                                            {notification.priority}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        {notification.message}
                                    </p>

                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.createdAt), {
                                                addSuffix: true,
                                                locale: ptBR
                                            })}
                                        </span>

                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Marcar como lida
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}


