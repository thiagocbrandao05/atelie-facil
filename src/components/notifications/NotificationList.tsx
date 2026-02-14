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
  STOCK_ALERT: 'text-warning',
  ORDER_DEADLINE: 'text-danger',
  ORDER_READY: 'text-success',
  SYSTEM: 'text-info',
  INFO: 'text-muted-foreground',
}

const priorityColors = {
  LOW: 'bg-muted/40 text-muted-foreground',
  NORMAL: 'bg-info/10 text-info',
  HIGH: 'bg-warning/10 text-warning',
  URGENT: 'bg-danger/10 text-danger',
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
      <div className="py-12 text-center">
        <Bell className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
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
        {notifications.map(notification => {
          const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info
          const iconColor =
            typeColors[notification.type as keyof typeof typeColors] || 'text-gray-600'

          return (
            <div
              key={notification.id}
              className={`rounded-lg border p-4 transition-colors ${
                notification.read ? 'bg-background' : 'bg-info/5 border-info/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-lg p-2 ${notification.read ? 'bg-muted' : 'bg-info/10'}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold">{notification.title}</h4>
                    <Badge className={priorityColors[notification.priority]}>
                      {notification.priority}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground text-sm">{notification.message}</p>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>

                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="mr-1 h-4 w-4" />
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
