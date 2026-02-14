import { logError } from './logger'
import { ActionResponse } from './types'
import { ZodError } from 'zod'

export class AppError extends Error {
    public readonly statusCode: number
    public readonly code: string

    constructor(message: string, statusCode = 400, code = 'APP_ERROR') {
        super(message)
        this.statusCode = statusCode
        this.code = code
        this.name = 'AppError'
        Object.setPrototypeOf(this, AppError.prototype)
    }
}

export async function handleActionError(
    error: unknown,
    actionName: string,
    contextData?: any
): Promise<ActionResponse> {
    // 1. Log the error
    await logError(error instanceof Error ? error : new Error(String(error)), {
        action: actionName,
        data: contextData,
    })

    // 2. Handle Known App Errors
    if (error instanceof AppError) {
        return {
            success: false,
            message: error.message,
        }
    }

    // 3. Handle Zod Errors (Validation)
    if (error instanceof ZodError) {
        const fieldErrors = error.flatten().fieldErrors
        // Convert Zod arrays to first message for simplicity in general message
        return {
            success: false,
            message: 'Dados inválidos. Verifique os campos.',
            errors: fieldErrors as Record<string, string[]>,
        }
    }

    // 4. Handle Unknown/System Errors
    // Don't leak system details in production
    const message =
        process.env.NODE_ENV === 'development'
            ? (error as Error).message || 'Erro desconhecido'
            : 'Ocorreu um erro inesperado. Tente novamente mais tarde.'

    return {
        success: false,
        message,
    }
}
