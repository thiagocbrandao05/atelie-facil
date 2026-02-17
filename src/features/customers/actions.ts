'use server'

import { createClient } from '@/lib/supabase/server'
import { CustomerSchema } from '@/lib/schemas'
import type { ActionResponse } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { validateCSRF } from '@/lib/security'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'
import type { Database } from '@/lib/supabase/types'

type CustomerInsert = Database['public']['Tables']['Customer']['Insert']
type CustomerUpdate = Database['public']['Tables']['Customer']['Update']
type ExistingCustomerRow = Pick<
  Database['public']['Tables']['Customer']['Row'],
  'id' | 'name' | 'phone' | 'email' | 'address' | 'birthday'
>

type DuplicateCandidate = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  birthday: string | null
  reasons: string[]
  score: number
}

type DuplicatePayload = {
  duplicateType: 'strict' | 'possible'
  canForce: boolean
  candidates: Array<{
    id: string
    name: string
    phone: string | null
    email: string | null
    address: string | null
    birthday: string | null
    reasons: string[]
  }>
}

type CustomerDuplicateInput = {
  name: string
  phone?: string
  email?: string
  address?: string
  birthday?: Date | null
}

const NAME_STOP_WORDS = new Set(['da', 'de', 'do', 'dos', 'das', 'e'])

type PostgrestLikeError = {
  code?: string
  message?: string
  details?: string
}

function toNullableIsoDate(value?: Date | null): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  return value.toISOString()
}

function normalizeText(value?: string | null): string {
  if (!value) return ''
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeName(value?: string | null): string {
  return normalizeText(value)
}

function tokenizeName(value?: string | null): string[] {
  return normalizeName(value)
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length > 1 && !NAME_STOP_WORDS.has(token))
}

function tokenizeText(value?: string | null): string[] {
  return normalizeText(value)
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length > 1)
}

function normalizeEmail(value?: string | null): string {
  return value?.trim().toLowerCase() || ''
}

function normalizePhone(value?: string | null): string {
  const digits = (value || '').replace(/\D/g, '')
  if (digits.length === 13 && digits.startsWith('55')) return digits.slice(2)
  if (digits.length > 11) return digits.slice(-11)
  return digits
}

function normalizeAddress(value?: string | null): string {
  return normalizeText(value)
    .replace(/\bcep\s*\d{5}\s*\d{3}\b/g, '')
    .trim()
}

function toDateKey(value?: string | Date | null): string | null {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function calculateNameSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1

  const tokensA = tokenizeName(a)
  const tokensB = tokenizeName(b)
  if (tokensA.length === 0 || tokensB.length === 0) return 0

  const setA = new Set(tokensA)
  const setB = new Set(tokensB)
  const intersection = [...setA].filter(token => setB.has(token)).length
  const unionSize = new Set([...setA, ...setB]).size
  const jaccard = unionSize === 0 ? 0 : intersection / unionSize

  const sameFirstToken = tokensA[0] === tokensB[0] ? 0.15 : 0
  const sameLastToken = tokensA[tokensA.length - 1] === tokensB[tokensB.length - 1] ? 0.15 : 0

  return Math.min(1, jaccard + sameFirstToken + sameLastToken)
}

function calculateTokenSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1

  const tokensA = tokenizeText(a)
  const tokensB = tokenizeText(b)
  if (tokensA.length === 0 || tokensB.length === 0) return 0

  const setA = new Set(tokensA)
  const setB = new Set(tokensB)
  const intersection = [...setA].filter(token => setB.has(token)).length
  const unionSize = new Set([...setA, ...setB]).size
  return unionSize === 0 ? 0 : intersection / unionSize
}

function buildDuplicatePayload(
  duplicateType: 'strict' | 'possible',
  canForce: boolean,
  candidates: DuplicateCandidate[]
): DuplicatePayload {
  return {
    duplicateType,
    canForce,
    candidates: candidates.map(candidate => ({
      id: candidate.id,
      name: candidate.name,
      phone: candidate.phone,
      email: candidate.email,
      address: candidate.address,
      birthday: candidate.birthday,
      reasons: candidate.reasons,
    })),
  }
}

function buildStrictDuplicateFieldErrors(
  candidates: DuplicateCandidate[]
): Record<string, string[]> {
  const hasPhoneDuplicate = candidates.some(candidate =>
    candidate.reasons.some(reason => reason.includes('telefone igual'))
  )
  const hasEmailDuplicate = candidates.some(candidate =>
    candidate.reasons.some(reason => reason.includes('e-mail igual'))
  )

  const errors: Record<string, string[]> = {}
  if (hasPhoneDuplicate) {
    errors.phone = ['Já existe cliente com este telefone.']
  }
  if (hasEmailDuplicate) {
    errors.email = ['Já existe cliente com este e-mail.']
  }
  if (!hasPhoneDuplicate && !hasEmailDuplicate) {
    errors.name = ['Cliente duplicado detectado.']
  }
  return errors
}

function parseUniqueViolation(
  error: unknown
): { field: 'phone' | 'email'; message: string } | null {
  if (!error || typeof error !== 'object') return null
  const pgError = error as PostgrestLikeError
  if (pgError.code !== '23505') return null

  const fullMessage = `${pgError.message || ''} ${pgError.details || ''}`.toLowerCase()

  if (
    fullMessage.includes('customer_tenant_phone_norm_uidx') ||
    fullMessage.includes('normalize_customer_phone')
  ) {
    return { field: 'phone', message: 'Já existe cliente com este telefone.' }
  }

  if (
    fullMessage.includes('customer_tenant_email_norm_uidx') ||
    fullMessage.includes('normalize_customer_email')
  ) {
    return { field: 'email', message: 'Já existe cliente com este e-mail.' }
  }

  return null
}

async function findCustomerDuplicates(params: {
  db: Awaited<ReturnType<typeof createClient>>
  tenantId: string
  input: CustomerDuplicateInput
  excludeId?: string
}) {
  let query = params.db
    .from('Customer')
    .select('id, name, phone, email, address, birthday')
    .eq('tenantId', params.tenantId)

  if (params.excludeId) {
    query = query.neq('id', params.excludeId)
  }

  const { data, error } = await query
  if (error) throw error

  const existingCustomers = (data ?? []) as ExistingCustomerRow[]
  const strict: DuplicateCandidate[] = []
  const possible: DuplicateCandidate[] = []

  const inputName = normalizeName(params.input.name)
  const inputPhone = normalizePhone(params.input.phone)
  const inputEmail = normalizeEmail(params.input.email)
  const inputAddress = normalizeAddress(params.input.address)
  const inputBirthday = toDateKey(params.input.birthday)

  for (const existing of existingCustomers) {
    const existingName = normalizeName(existing.name)
    const existingPhone = normalizePhone(existing.phone)
    const existingEmail = normalizeEmail(existing.email)
    const existingAddress = normalizeAddress(existing.address)
    const existingBirthday = toDateKey(existing.birthday)

    const strictReasons: string[] = []
    if (inputPhone && existingPhone && inputPhone === existingPhone) {
      strictReasons.push('telefone igual')
    }
    if (inputEmail && existingEmail && inputEmail === existingEmail) {
      strictReasons.push('e-mail igual')
    }

    if (strictReasons.length > 0) {
      strict.push({
        id: existing.id,
        name: existing.name,
        phone: existing.phone,
        email: existing.email,
        address: existing.address,
        birthday: existingBirthday,
        reasons: strictReasons,
        score: 10,
      })
      continue
    }

    const nameSimilarity = calculateNameSimilarity(inputName, existingName)
    if (nameSimilarity < 0.5) continue

    const reasons: string[] = [`nome parecido (${Math.round(nameSimilarity * 100)}%)`]
    let score = nameSimilarity
    let strongEvidenceCount = 0
    const hasVeryStrongNameSimilarity = nameSimilarity >= 0.86

    if (inputBirthday && existingBirthday && inputBirthday === existingBirthday) {
      reasons.push('mesma data de aniversario')
      score += 0.45
      strongEvidenceCount += 1
    }

    const addressSimilarity =
      inputAddress && existingAddress ? calculateTokenSimilarity(inputAddress, existingAddress) : 0

    if (inputAddress && existingAddress && inputAddress === existingAddress) {
      reasons.push('mesmo endereco')
      score += 0.35
      strongEvidenceCount += 1
    } else if (addressSimilarity >= 0.74) {
      reasons.push(`endereco muito parecido (${Math.round(addressSimilarity * 100)}%)`)
      score += 0.28
      strongEvidenceCount += 1
    }

    if (
      inputPhone &&
      existingPhone &&
      inputPhone.length >= 8 &&
      existingPhone.length >= 8 &&
      inputPhone.slice(-8) === existingPhone.slice(-8)
    ) {
      reasons.push('telefone muito parecido')
      score += 0.25
      strongEvidenceCount += 1
    }

    if (inputEmail && existingEmail) {
      const [inputLocal] = inputEmail.split('@')
      const [existingLocal] = existingEmail.split('@')
      if (inputLocal && existingLocal && inputLocal === existingLocal) {
        reasons.push('e-mail muito parecido')
        score += 0.2
        strongEvidenceCount += 1
      }
    }

    const hasEnoughSignals = strongEvidenceCount >= 2 && nameSimilarity >= 0.5
    const hasOneSignalAndGoodName =
      strongEvidenceCount >= 1 && nameSimilarity >= 0.62 && score >= 0.95

    if (!hasVeryStrongNameSimilarity && !hasEnoughSignals && !hasOneSignalAndGoodName) continue

    possible.push({
      id: existing.id,
      name: existing.name,
      phone: existing.phone,
      email: existing.email,
      address: existing.address,
      birthday: existingBirthday,
      reasons,
      score,
    })
  }

  strict.sort((a, b) => b.score - a.score)
  possible.sort((a, b) => b.score - a.score)

  return { strict, possible }
}

async function assertCSRFValid() {
  const csrf = await validateCSRF()
  if (!csrf.valid) {
    return actionError(csrf.error || 'CSRF inválido.')
  }
  return null
}

export async function getCustomers() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('Customer')
    .select('*')
    .eq('tenantId', user.tenantId)
    .order('name', { ascending: true })

  return data ?? []
}

export async function createCustomer(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
    address: formData.get('address') || undefined,
    notes: formData.get('notes') || undefined,
    birthday: formData.get('birthday') || undefined,
  }
  const validatedFields = CustomerSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return actionError('Dados inválidos.', validatedFields.error.flatten().fieldErrors)
  }

  try {
    const db = await createClient()
    const forceDuplicate = formData.get('forceDuplicate') === '1'
    const workspaceSlug = user.tenant?.slug
    const duplicateResult = await findCustomerDuplicates({
      db,
      tenantId: user.tenantId,
      input: validatedFields.data,
    })

    if (duplicateResult.strict.length > 0) {
      return actionError<DuplicatePayload>(
        'Já existe cliente com o mesmo telefone ou e-mail.',
        buildStrictDuplicateFieldErrors(duplicateResult.strict),
        buildDuplicatePayload('strict', false, duplicateResult.strict.slice(0, 3))
      )
    }

    if (!forceDuplicate && duplicateResult.possible.length > 0) {
      return actionError<DuplicatePayload>(
        'Encontramos possível cliente duplicado. Revise os dados e confirme para continuar.',
        undefined,
        buildDuplicatePayload('possible', true, duplicateResult.possible.slice(0, 3))
      )
    }

    const customerPayload: CustomerInsert = {
      ...validatedFields.data,
      birthday: toNullableIsoDate(validatedFields.data.birthday),
      tenantId: user.tenantId,
    }

    const { data: customer, error } = await db
      .from('Customer')
      .insert(customerPayload as never)
      .select()
      .single()
    const createdCustomer = customer as { id: string } | null

    if (error) throw error
    if (!createdCustomer) throw new Error('Cliente não encontrado após criação')

    await logAction(user.tenantId, user.id, 'CREATE', 'Customer', createdCustomer.id, {
      name: validatedFields.data.name,
      email: validatedFields.data.email,
    })

    if (workspaceSlug) {
      revalidateWorkspaceAppPaths(workspaceSlug, ['/clientes'])
    }
    return actionSuccess('Cliente cadastrado!', createdCustomer)
  } catch (error) {
    const uniqueViolation = parseUniqueViolation(error)
    if (uniqueViolation) {
      return actionError(uniqueViolation.message, {
        [uniqueViolation.field]: [uniqueViolation.message],
      })
    }
    console.error('Failed to create customer:', error)
    return actionError('Erro ao cadastrar cliente.')
  }
}

export async function deleteCustomer(id: string): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const db = await createClient()
    const workspaceSlug = user.tenant?.slug
    const { error } = await db.from('Customer').delete().eq('id', id)
    if (error) throw error

    await logAction(user.tenantId, user.id, 'DELETE', 'Customer', id)

    if (workspaceSlug) {
      revalidateWorkspaceAppPaths(workspaceSlug, ['/clientes'])
    }
    return actionSuccess('Cliente removido!')
  } catch {
    return actionError('Erro ao remover cliente. Verifique se ele possui pedidos.')
  }
}

export async function updateCustomer(
  id: string,
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
    address: formData.get('address') || undefined,
    notes: formData.get('notes') || undefined,
    birthday: formData.get('birthday') || undefined,
  }
  const validatedFields = CustomerSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return actionError('Dados inválidos.', validatedFields.error.flatten().fieldErrors)
  }

  try {
    const db = await createClient()
    const forceDuplicate = formData.get('forceDuplicate') === '1'
    const workspaceSlug = user.tenant?.slug
    const duplicateResult = await findCustomerDuplicates({
      db,
      tenantId: user.tenantId,
      input: validatedFields.data,
      excludeId: id,
    })

    if (duplicateResult.strict.length > 0) {
      return actionError<DuplicatePayload>(
        'Já existe outro cliente com o mesmo telefone ou e-mail.',
        buildStrictDuplicateFieldErrors(duplicateResult.strict),
        buildDuplicatePayload('strict', false, duplicateResult.strict.slice(0, 3))
      )
    }

    if (!forceDuplicate && duplicateResult.possible.length > 0) {
      return actionError<DuplicatePayload>(
        'Encontramos possível cliente duplicado. Revise os dados e confirme para continuar.',
        undefined,
        buildDuplicatePayload('possible', true, duplicateResult.possible.slice(0, 3))
      )
    }

    const customerPayload: CustomerUpdate = {
      ...validatedFields.data,
      birthday: toNullableIsoDate(validatedFields.data.birthday),
    }

    const { error } = await db
      .from('Customer')
      .update(customerPayload as never)
      .eq('id', id)

    if (error) throw error

    await logAction(user.tenantId, user.id, 'UPDATE', 'Customer', id, validatedFields.data)

    if (workspaceSlug) {
      revalidateWorkspaceAppPaths(workspaceSlug, ['/clientes'])
    }
    return actionSuccess('Cliente atualizado!')
  } catch (error) {
    const uniqueViolation = parseUniqueViolation(error)
    if (uniqueViolation) {
      const message =
        uniqueViolation.field === 'phone'
          ? 'Já existe outro cliente com este telefone.'
          : 'Já existe outro cliente com este e-mail.'
      return actionError(message, { [uniqueViolation.field]: [message] })
    }
    console.error('Failed to update customer:', error)
    return actionError('Erro ao atualizar cliente.')
  }
}

export async function getCustomerOrders(customerId: string) {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('Order')
    .select(
      `
            id,
            status,
            totalValue,
            createdAt,
            items:OrderItem(
                productId,
                quantity,
                product:Product(name)
            )
        `
    )
    .eq('tenantId', user.tenantId)
    .eq('customerId', customerId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching customer orders:', error)
    return []
  }

  return data ?? []
}

export async function getCustomerLtv(customerId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { deliveredOrders: 0, lifetimeValue: 0 }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('Order')
    .select('totalValue')
    .eq('tenantId', user.tenantId)
    .eq('customerId', customerId)
    .eq('status', 'DELIVERED')

  if (error || !data) {
    console.error('Error fetching customer LTV:', error)
    return { deliveredOrders: 0, lifetimeValue: 0 }
  }

  const deliveredOrders = data as Array<{ totalValue: number | string | null }>
  const lifetimeValue = deliveredOrders.reduce(
    (sum, order) => sum + Number(order.totalValue || 0),
    0
  )

  return {
    deliveredOrders: deliveredOrders.length,
    lifetimeValue,
  }
}
