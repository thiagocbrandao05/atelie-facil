'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import type { ActionResponse, MaterialQueryResponse } from '@/lib/types'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'
import type { Database } from '@/lib/supabase/types'

type MaterialInsert = Database['public']['Tables']['Material']['Insert']
type MaterialUpdate = Database['public']['Tables']['Material']['Update']
type MaterialRow = Database['public']['Tables']['Material']['Row']
type ExistingMaterialRow = Pick<MaterialRow, 'id' | 'name' | 'unit' | 'colors'>
type MaterialFormDraft = {
  name: string
  unit: string
  minQuantity: string
  supplierId: string
  colors: string
}
type MaterialDuplicateCandidate = {
  id: string
  name: string
  unit: string
  reasons: string[]
  score: number
}
type MaterialActionData = MaterialFormDraft & {
  duplicateType?: 'possible'
  canForce?: boolean
  candidates?: Array<{
    id: string
    name: string
    unit: string
    reasons: string[]
  }>
}

type PostgrestLikeError = {
  code?: string
  message?: string
  details?: string
}

const materialSchema = z.object({
  name: z.string().min(1, 'Nome do material e obrigatorio'),
  unit: z.string().min(1, 'Unidade e obrigatoria'),
  minQuantity: z.coerce.number().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  colors: z.string().optional(),
})

const MATERIAL_NAME_STOP_WORDS = new Set(['da', 'de', 'do', 'dos', 'das', 'e', 'com', 'para'])
const MATERIAL_POSSIBLE_DUPLICATE_THRESHOLD = 0.52

function parseColors(colors?: string | null) {
  if (!colors) return []

  const seen = new Set<string>()
  const parsed: string[] = []

  for (const rawColor of colors.split(',')) {
    const color = rawColor.trim()
    if (!color) continue

    const key = color.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    parsed.push(color)
  }

  return parsed
}

function normalizeMaterialName(value?: string | null): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeColor(value?: string | null): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeMaterialName(value?: string | null): string[] {
  return normalizeMaterialName(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length > 1 && !MATERIAL_NAME_STOP_WORDS.has(token))
}

function calculateMaterialNameSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1

  const tokensA = tokenizeMaterialName(a)
  const tokensB = tokenizeMaterialName(b)
  if (tokensA.length === 0 || tokensB.length === 0) return 0

  const setA = new Set(tokensA)
  const setB = new Set(tokensB)
  const intersection = [...setA].filter(token => setB.has(token)).length
  const unionSize = new Set([...setA, ...setB]).size
  const jaccard = unionSize === 0 ? 0 : intersection / unionSize

  const sameFirstToken = tokensA[0] === tokensB[0] ? 0.2 : 0
  const sameLastToken = tokensA[tokensA.length - 1] === tokensB[tokensB.length - 1] ? 0.15 : 0

  const containsRelation =
    Math.min(a.length, b.length) >= 5 && (a.includes(b) || b.includes(a)) ? 0.25 : 0

  return Math.min(1, jaccard + sameFirstToken + sameLastToken + containsRelation)
}

function parseUniqueViolation(error: unknown): { field: 'name'; message: string } | null {
  if (!error || typeof error !== 'object') return null
  const pgError = error as PostgrestLikeError
  if (pgError.code !== '23505') return null

  const fullMessage = `${pgError.message || ''} ${pgError.details || ''}`.toLowerCase()
  if (
    fullMessage.includes('material_tenant_name_norm_uidx') ||
    fullMessage.includes('normalize_material_name')
  ) {
    return { field: 'name', message: 'Ja existe um material com este nome.' }
  }

  return null
}

function toMaterialFormDraft(rawData: {
  name: FormDataEntryValue | null
  unit: FormDataEntryValue | null
  minQuantity: FormDataEntryValue | null
  supplierId: FormDataEntryValue | null
  colors: FormDataEntryValue | null
}): MaterialFormDraft {
  const toStringValue = (value: FormDataEntryValue | null) =>
    typeof value === 'string' ? value : ''

  return {
    name: toStringValue(rawData.name),
    unit: toStringValue(rawData.unit),
    minQuantity: toStringValue(rawData.minQuantity),
    supplierId: toStringValue(rawData.supplierId),
    colors: toStringValue(rawData.colors),
  }
}

function buildPossibleDuplicateData(
  draft: MaterialFormDraft,
  candidates: MaterialDuplicateCandidate[]
): MaterialActionData {
  return {
    ...draft,
    duplicateType: 'possible',
    canForce: true,
    candidates: candidates.map(candidate => ({
      id: candidate.id,
      name: candidate.name,
      unit: candidate.unit,
      reasons: candidate.reasons,
    })),
  }
}

function buildPossibleMaterialCandidates(
  materials: ExistingMaterialRow[],
  inputName: string
): MaterialDuplicateCandidate[] {
  const normalizedInputName = normalizeMaterialName(inputName)
  if (!normalizedInputName) return []

  const possible: MaterialDuplicateCandidate[] = []

  for (const existing of materials) {
    const normalizedExistingName = normalizeMaterialName(existing.name)
    const similarity = calculateMaterialNameSimilarity(normalizedInputName, normalizedExistingName)
    if (similarity < MATERIAL_POSSIBLE_DUPLICATE_THRESHOLD) continue

    possible.push({
      id: existing.id,
      name: existing.name,
      unit: existing.unit || '',
      reasons: [`nome parecido (${Math.round(similarity * 100)}%)`],
      score: similarity,
    })
  }

  possible.sort((a, b) => b.score - a.score)
  return possible
}

async function findMaterialConflicts(params: {
  db: Awaited<ReturnType<typeof createClient>>
  tenantId: string
  name: string
  excludeId?: string
}): Promise<{ exact: ExistingMaterialRow | null; possible: MaterialDuplicateCandidate[] }> {
  const normalizedInputName = normalizeMaterialName(params.name)
  if (!normalizedInputName) {
    return { exact: null, possible: [] }
  }

  let query = params.db
    .from('Material')
    .select('id, name, unit, colors')
    .eq('tenantId', params.tenantId)

  if (params.excludeId) {
    query = query.neq('id', params.excludeId)
  }

  const { data, error } = await query
  if (error) throw error

  const materials = (data ?? []) as ExistingMaterialRow[]
  const exact =
    materials.find(material => normalizeMaterialName(material.name) === normalizedInputName) ?? null

  const possible = buildPossibleMaterialCandidates(
    exact ? materials.filter(material => material.id !== exact.id) : materials,
    params.name
  )

  return { exact, possible }
}

function mergeNewColors(existingColors: string[] | null, incomingColors: string[]) {
  const current = Array.isArray(existingColors) ? [...existingColors] : []
  const existingKeys = new Set(current.map(color => normalizeColor(color)).filter(Boolean))
  const addedColors: string[] = []

  for (const color of incomingColors) {
    const key = normalizeColor(color)
    if (!key || existingKeys.has(key)) continue
    existingKeys.add(key)
    addedColors.push(color)
  }

  return {
    mergedColors: [...current, ...addedColors],
    addedColors,
  }
}

export async function createMaterial(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const rawData = {
    name: formData.get('name'),
    unit: formData.get('unit'),
    minQuantity: formData.get('minQuantity'),
    supplierId: formData.get('supplierId'),
    colors: formData.get('colors'),
  }
  const draft = toMaterialFormDraft(rawData)

  const validated = materialSchema.safeParse(rawData)
  if (!validated.success) {
    return actionError('Erro de validacao', validated.error.flatten().fieldErrors, draft)
  }

  const { name, unit, minQuantity, supplierId, colors } = validated.data
  const colorArray = parseColors(colors)
  const supabase = await createClient()

  try {
    const forceDuplicate = formData.get('forceDuplicate') === '1'
    const conflicts = await findMaterialConflicts({
      db: supabase,
      tenantId: user.tenantId,
      name,
    })
    const existingMaterial = conflicts.exact

    if (existingMaterial) {
      const { mergedColors, addedColors } = mergeNewColors(existingMaterial.colors, colorArray)

      if (addedColors.length === 0) {
        return actionError(
          'Ja existe um material com este nome.',
          {
            name: ['Ja existe um material com este nome.'],
          },
          draft
        )
      }

      const updatePayload: MaterialUpdate = {
        colors: mergedColors,
      }

      const { error: updateError } = await supabase
        .from('Material')
        // @ts-expect-error legacy schema not fully represented in generated DB types
        .update(updatePayload)
        .eq('id', existingMaterial.id)
        .eq('tenantId', user.tenantId)

      if (updateError) throw updateError

      const slug = user.tenant?.slug
      if (slug) {
        revalidateWorkspaceAppPaths(slug, ['/estoque'])
      }

      const message =
        addedColors.length === 1
          ? 'Material ja existente. Cor adicionada com sucesso.'
          : `Material ja existente. ${addedColors.length} cores adicionadas com sucesso.`

      return actionSuccess(message)
    }

    if (!forceDuplicate && conflicts.possible.length > 0) {
      return actionError<MaterialActionData>(
        'Encontramos material com nome parecido. Revise e confirme para continuar.',
        undefined,
        buildPossibleDuplicateData(draft, conflicts.possible.slice(0, 3))
      )
    }

    const insertPayload: MaterialInsert = {
      tenantId: user.tenantId,
      name,
      unit,
      quantity: 0,
      minQuantity: minQuantity || null,
      supplierId: supplierId || null,
      colors: colorArray,
    }

    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error } = await supabase.from('Material').insert(insertPayload)

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/estoque'])
    }
    return actionSuccess('Material criado com sucesso!')
  } catch (error) {
    const uniqueViolation = parseUniqueViolation(error)
    if (uniqueViolation) {
      return actionError<MaterialActionData>(
        uniqueViolation.message,
        { [uniqueViolation.field]: [uniqueViolation.message] },
        draft
      )
    }

    console.error('Server Error:', error)
    return actionError<MaterialActionData>('Erro no servidor', undefined, draft)
  }
}

export async function updateMaterial(
  id: string,
  _prevState: unknown,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const rawData = {
    name: formData.get('name'),
    unit: formData.get('unit'),
    minQuantity: formData.get('minQuantity'),
    supplierId: formData.get('supplierId'),
    colors: formData.get('colors'),
  }
  const draft = toMaterialFormDraft(rawData)

  const validated = materialSchema.safeParse(rawData)
  if (!validated.success) {
    return actionError('Erro de validacao', validated.error.flatten().fieldErrors, draft)
  }

  const { name, unit, minQuantity, supplierId, colors } = validated.data
  const colorArray = parseColors(colors)
  const supabase = await createClient()

  try {
    const forceDuplicate = formData.get('forceDuplicate') === '1'
    const conflicts = await findMaterialConflicts({
      db: supabase,
      tenantId: user.tenantId,
      name,
      excludeId: id,
    })
    const duplicate = conflicts.exact
    if (duplicate) {
      return actionError(
        'Ja existe um material com este nome.',
        {
          name: ['Ja existe um material com este nome.'],
        },
        draft
      )
    }

    if (!forceDuplicate && conflicts.possible.length > 0) {
      return actionError<MaterialActionData>(
        'Encontramos material com nome parecido. Revise e confirme para continuar.',
        undefined,
        buildPossibleDuplicateData(draft, conflicts.possible.slice(0, 3))
      )
    }

    const updatePayload: MaterialUpdate = {
      name,
      unit,
      minQuantity: minQuantity || null,
      supplierId: supplierId || null,
      colors: colorArray,
    }

    const { error } = await supabase
      .from('Material')
      // @ts-expect-error legacy schema not fully represented in generated DB types
      .update(updatePayload)
      .eq('id', id)
      .eq('tenantId', user.tenantId)

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/estoque'])
    }
    return actionSuccess('Material atualizado com sucesso!')
  } catch (error) {
    const uniqueViolation = parseUniqueViolation(error)
    if (uniqueViolation) {
      return actionError<MaterialActionData>(
        uniqueViolation.message,
        { [uniqueViolation.field]: [uniqueViolation.message] },
        draft
      )
    }

    console.error('Update Error:', error)
    return actionError<MaterialActionData>('Erro ao atualizar material', undefined, draft)
  }
}

export async function deleteMaterial(id: string) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const supabase = await createClient()
  const { error } = await supabase
    .from('Material')
    .delete()
    .eq('id', id)
    .eq('tenantId', user.tenantId)

  if (error) {
    return actionError('Erro ao deletar material')
  }

  const slug = user.tenant?.slug
  if (slug) {
    revalidateWorkspaceAppPaths(slug, ['/estoque'])
  }
  return actionSuccess('Material deletado')
}

export async function getMaterials() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()

  const { data: materialsData, error: materialsError } = await supabase
    .from('Material')
    .select(
      `
            *,
            Supplier (name)
        `
    )
    .eq('tenantId', user.tenantId)
    .order('name')

  if (materialsError) {
    console.error('Error fetching materials:', materialsError.message, materialsError)
    return []
  }

  const rawData = materialsData as unknown as MaterialQueryResponse[]

  return rawData.map(material => ({
    ...material,
    supplierName: material.Supplier?.name,
    cost: material.cost || 0,
    colors: Array.isArray(material.colors) ? material.colors : [],
  }))
}
