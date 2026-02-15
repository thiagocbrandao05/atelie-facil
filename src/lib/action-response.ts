import type { ActionResponse } from '@/lib/types'

export function actionSuccess<T = unknown>(message: string, data?: T): ActionResponse<T> {
  return { success: true, message, data }
}

export function actionError(message: string, errors?: Record<string, string[]>): ActionResponse {
  return { success: false, message, errors }
}

export function unauthorizedAction(): ActionResponse {
  return actionError('Não autorizado')
}
