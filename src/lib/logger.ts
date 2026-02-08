import { getCurrentUser } from './auth'

interface LogContext {
    action: string
    data?: any
    userId?: string
    error?: Error
}

export async function logError(
    error: Error,
    context: { action: string; data?: any }
) {
    const user = await getCurrentUser()

    const logEntry = {
        timestamp: new Date().toISOString(),
        userId: user?.id,
        userEmail: user?.email,
        action: context.action,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        data: context.data
    }

    // Em desenvolvimento: console
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', logEntry)
    }

    // Em produção: enviar para serviço de logging (Sentry, LogRocket, etc)
    // TODO: Integrar com Sentry quando em produção
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { contexts: { custom: logEntry } })
    // }

    return logEntry
}

export async function logInfo(message: string, context?: Record<string, any>) {
    const user = await getCurrentUser()

    const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        userId: user?.id,
        message,
        ...context
    }

    if (process.env.NODE_ENV === 'development') {
        console.log('ℹ️ Info:', logEntry)
    }

    return logEntry
}

export async function logWarning(message: string, context?: Record<string, any>) {
    const user = await getCurrentUser()

    const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'warning',
        userId: user?.id,
        message,
        ...context
    }

    if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Warning:', logEntry)
    }

    return logEntry
}

