/**
 * Notification system for user alerts and updates
 */

'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
    id: string
    type: NotificationType
    title: string
    message: string
    duration?: number
    timestamp: Date
}

interface NotificationContextType {
    notifications: Notification[]
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
    removeNotification: (id: string) => void
    clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([])

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
        const id = Math.random().toString(36).substring(7)
        const newNotification: Notification = {
            ...notification,
            id,
            timestamp: new Date()
        }

        setNotifications(prev => [...prev, newNotification])

        // Auto-remove after duration
        if (notification.duration !== 0) {
            setTimeout(() => {
                removeNotification(id)
            }, notification.duration || 5000)
        }
    }, [removeNotification])

    const clearAll = useCallback(() => {
        setNotifications([])
    }, [])

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider')
    }
    return context
}

function NotificationContainer() {
    const { notifications, removeNotification } = useNotifications()

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
            {notifications.map(notification => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    )
}

const NOTIFICATION_STYLES = {
    success: {
        bg: 'bg-success/10',
        border: 'border-success/20',
        icon: CheckCircle,
        iconColor: 'text-success'
    },
    error: {
        bg: 'bg-danger/10',
        border: 'border-danger/20',
        icon: AlertCircle,
        iconColor: 'text-danger'
    },
    warning: {
        bg: 'bg-warning/10',
        border: 'border-warning/20',
        icon: AlertTriangle,
        iconColor: 'text-warning'
    },
    info: {
        bg: 'bg-info/10',
        border: 'border-info/20',
        icon: Info,
        iconColor: 'text-info'
    }
}

function NotificationItem({ notification, onClose }: { notification: Notification; onClose: () => void }) {
    const style = NOTIFICATION_STYLES[notification.type]
    const Icon = style.icon

    return (
        <div
            className={cn(
                'flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right',
                style.bg,
                style.border
            )}
        >
            <Icon className={cn('h-5 w-5 mt-0.5', style.iconColor)} />
            <div className="flex-1">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
            </div>
            <button
                onClick={onClose}
                aria-label="Fechar notificação"
                className="text-muted-foreground hover:text-foreground transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

/**
 * Helper hook for common notification patterns
 */
export function useToast() {
    const { addNotification } = useNotifications()

    return {
        success: (title: string, message: string) =>
            addNotification({ type: 'success', title, message }),
        error: (title: string, message: string) =>
            addNotification({ type: 'error', title, message }),
        warning: (title: string, message: string) =>
            addNotification({ type: 'warning', title, message }),
        info: (title: string, message: string) =>
            addNotification({ type: 'info', title, message })
    }
}
