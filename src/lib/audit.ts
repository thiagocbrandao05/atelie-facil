import { createClient } from '@/lib/supabase/server'
// import { AuditAction, AuditStatus } from '@prisma/client'
import { AuditAction } from '@/lib/types'

export type AuditStatus = 'SUCCESS' | 'FAILED'

export interface AuditLogData {
  tenantId: string
  userId?: string
  action: AuditAction
  entity: string
  entityId?: string
  changes?: Record<string, unknown>
  metadata?: Record<string, unknown>
  status?: AuditStatus
  errorMessage?: string
}

/**
 * Create an audit log entry
 * Silent fail - don't break app if audit fails
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    const supabase = await createClient()
    // @ts-expect-error legacy schema not fully represented in generated DB types
    await supabase.from('AuditLog').insert({
      ...data,
      userId: data.userId || 'system', // Handle optional userId
      details: {
        changes: data.changes,
        metadata: data.metadata,
        errorMessage: data.errorMessage,
      }, // Map to JSONB column 'details'
      status: data.status || 'SUCCESS', // If 'status' column exists, otherwise put in details
    })
  } catch (error) {
    // Silent fail - logging should never break the app
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Simplified audit logging function
 */
export async function logAction(
  tenantId: string,
  userId: string | undefined,
  action: AuditAction,
  entity: string,
  entityId?: string,
  changes?: Record<string, unknown>,
  metadata?: Record<string, unknown>
) {
  return createAuditLog({
    tenantId,
    userId,
    action,
    entity,
    entityId,
    changes,
    metadata,
  })
}

/**
 * Log authentication events
 */
export async function logAuth(
  tenantId: string,
  userId: string | undefined,
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED',
  metadata?: Record<string, unknown>
) {
  return createAuditLog({
    tenantId,
    userId,
    action,
    entity: 'User',
    entityId: userId,
    metadata,
    status: action === 'LOGIN_FAILED' ? 'FAILED' : 'SUCCESS',
  })
}

/**
 * Log failed operations
 */
export async function logError(
  tenantId: string,
  userId: string | undefined,
  action: AuditAction,
  entity: string,
  errorMessage: string,
  metadata?: Record<string, unknown>
) {
  return createAuditLog({
    tenantId,
    userId,
    action,
    entity,
    status: 'FAILED',
    errorMessage,
    metadata,
  })
}
