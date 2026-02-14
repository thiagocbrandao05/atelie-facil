import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getNotifications, getUnreadCount } from '@/features/notifications/actions'
import { Bell } from 'lucide-react'

const NotificationList = dynamic(
  () =>
    import('@/components/notifications/NotificationList').then(mod => ({
      default: mod.NotificationList,
    })),
  {
    loading: () => (
      <div className="text-muted-foreground py-8 text-center">Carregando notificações...</div>
    ),
    ssr: true,
  }
)

export const metadata = {
  title: 'Notificações | Atelis',
  description: 'Central de notificações do sistema',
}

export default async function NotificacoesPage() {
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(false),
    getUnreadCount(),
  ])

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Notificações</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Central de notificações e alertas do sistema
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="bg-info/10 flex items-center gap-2 rounded-lg px-4 py-2">
            <Bell className="text-info h-5 w-5" />
            <span className="text-info font-semibold">
              {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as notificações</CardTitle>
          <CardDescription>Histórico completo de notificações e alertas</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={<div className="text-muted-foreground py-4">Carregando notificações...</div>}
          >
            <NotificationList notifications={notifications} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
