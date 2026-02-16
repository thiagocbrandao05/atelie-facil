import type { ActionResponse } from '@/lib/types'

export function actionSuccess<T = unknown>(message: string, data?: T): ActionResponse<T> {
  return { success: true, message, data }
}

export function actionError<T = unknown>(
  message: string,
  errors?: Record<string, string[]>,
  data?: T
): ActionResponse<T> {
  return { success: false, message, errors, data }
}

export function unauthorizedAction<T = unknown>(): ActionResponse<T> {
  return actionError<T>('Nao autorizado')
}
