'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { DEFAULT_THEME } from '@/lib/theme-tokens'
import { validateCSRF } from '@/lib/security'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'

type FixedCostItem = { id?: string; name?: string; value?: number }
type SettingsRecord = {
  [key: string]: unknown
  hourlyRate?: number | string
  whatsappPhoneNumberId?: string
  whatsappAccessToken?: string
  whatsappConfigVerified?: boolean
  financialDisplayMode?: string
  marginThresholdWarning?: number | string
  marginThresholdOptimal?: number | string
  taxRate?: number | string
  cardFeeRate?: number | string
  targetMonthlyProfit?: number | string
}

async function assertCSRFValid() {
  const csrf = await validateCSRF()
  if (!csrf.valid) {
    return actionError(csrf.error || 'CSRF inválido.')
  }
  return null
}

const ProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
})

const PasswordSchema = z
  .object({
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirmação deve ter pelo menos 6 caracteres'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

const SettingsSchema = z.object({
  storeName: z.string().min(2, 'Nome da loja deve ter pelo menos 2 caracteres'),
  hourlyRate: z.coerce.number().min(0, 'Valor deve ser positivo'),
  phone: z.string().optional(),
  email: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  msgQuotation: z.string().optional(),
  msgReady: z.string().optional(),
  msgApproved: z.string().optional(),
  msgFinished: z.string().optional(),
  primaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  quotationValidityDays: z.coerce.number().optional(),
  defaultQuotationNotes: z.string().optional(),
  monthlyFixedCosts: z.string().optional(),
  desirableSalary: z.coerce.number().optional(),
  workingHoursPerMonth: z.coerce.number().optional(),
  defaultProfitMargin: z.coerce.number().optional(),
  taxRate: z.coerce.number().optional(),
  cardFeeRate: z.coerce.number().optional(),
  targetMonthlyProfit: z.coerce.number().optional(),
  psychologicalPricingPattern: z.string().optional(),
  financialDisplayMode: z.enum(['simple', 'advanced']).optional(),
  marginThresholdWarning: z.coerce.number().optional(),
  marginThresholdOptimal: z.coerce.number().optional(),
})

function parseFixedCosts(jsonValue?: string): FixedCostItem[] {
  if (!jsonValue) return []
  try {
    const parsed = JSON.parse(jsonValue)
    return Array.isArray(parsed) ? (parsed as FixedCostItem[]) : []
  } catch (error) {
    console.error('Failed to parse fixed costs', error)
    return []
  }
}

export async function updateProfile(_prevState: unknown, formData: FormData) {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  try {
    const user = await getCurrentUser()
    if (!user) return unauthorizedAction()

    const data = ProfileSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
    })

    const db = await createClient()
    const { error } = await db
      .from('User')
      // @ts-expect-error legacy table typing missing in generated Database type
      .update({
        name: data.name,
        email: data.email,
      })
      .eq('id', user.id)

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/perfil'])
    }
    return actionSuccess('Perfil atualizado com sucesso!')
  } catch (error) {
    console.error('updateProfile error:', error)
    return actionError('Erro ao atualizar perfil')
  }
}

export async function updatePassword(_prevState: unknown, formData: FormData) {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  try {
    const user = await getCurrentUser()
    if (!user) return unauthorizedAction()

    const validation = PasswordSchema.safeParse({
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    })

    if (!validation.success) {
      return actionError(validation.error.issues[0]?.message || 'Dados inválidos')
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({
      password: validation.data.password,
    })

    if (error) throw error
    return actionSuccess('Senha atualizada com sucesso!')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar senha'
    return actionError(message)
  }
}

export async function updateSettings(_prevState: unknown, formData: FormData) {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const tenantId = user.tenantId
    const slug = user.tenant?.slug

    const data = SettingsSchema.parse({
      storeName: formData.get('storeName'),
      hourlyRate: formData.get('hourlyRate'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      instagram: formData.get('instagram'),
      facebook: formData.get('facebook'),
      msgQuotation: formData.get('msgQuotation'),
      msgReady: formData.get('msgReady'),
      msgApproved: formData.get('msgApproved'),
      msgFinished: formData.get('msgFinished'),
      primaryColor: formData.get('primaryColor'),
      logoUrl: formData.get('logoUrl'),
      addressStreet: formData.get('addressStreet'),
      addressNumber: formData.get('addressNumber'),
      addressComplement: formData.get('addressComplement'),
      addressNeighborhood: formData.get('addressNeighborhood'),
      addressCity: formData.get('addressCity'),
      addressState: formData.get('addressState'),
      addressZip: formData.get('addressZip'),
      quotationValidityDays: formData.get('quotationValidityDays'),
      defaultQuotationNotes: formData.get('defaultQuotationNotes'),
      monthlyFixedCosts: formData.get('monthlyFixedCosts'),
      desirableSalary: formData.get('desirableSalary'),
      workingHoursPerMonth: formData.get('workingHoursPerMonth'),
      defaultProfitMargin: formData.get('defaultProfitMargin'),
      taxRate: formData.get('taxRate'),
      cardFeeRate: formData.get('cardFeeRate'),
      targetMonthlyProfit: formData.get('targetMonthlyProfit'),
      psychologicalPricingPattern: formData.get('psychologicalPricingPattern'),
      financialDisplayMode: formData.get('financialDisplayMode'),
      marginThresholdWarning: formData.get('marginThresholdWarning'),
      marginThresholdOptimal: formData.get('marginThresholdOptimal'),
    })

    const db = await createClient()
    const fixedCosts = parseFixedCosts(data.monthlyFixedCosts)

    // @ts-expect-error legacy table typing missing in generated Database type
    const { error } = await db.from('Settings').upsert(
      {
        tenantId,
        storeName: data.storeName,
        hourlyRate: data.hourlyRate,
        phone: data.phone || null,
        email: data.email || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        msgQuotation: data.msgQuotation || null,
        msgReady: data.msgReady || null,
        msgApproved: data.msgApproved || null,
        msgFinished: data.msgFinished || null,
        primaryColor: data.primaryColor || DEFAULT_THEME,
        logoUrl: data.logoUrl || null,
        addressStreet: data.addressStreet || null,
        addressNumber: data.addressNumber || null,
        addressComplement: data.addressComplement || null,
        addressNeighborhood: data.addressNeighborhood || null,
        addressCity: data.addressCity || null,
        addressState: data.addressState || null,
        addressZip: data.addressZip || null,
        quotationValidityDays: data.quotationValidityDays || 15,
        defaultQuotationNotes: data.defaultQuotationNotes || null,
        monthlyFixedCosts: fixedCosts,
        desirableSalary: data.desirableSalary || 2000,
        workingHoursPerMonth: data.workingHoursPerMonth || 160,
        defaultProfitMargin: data.defaultProfitMargin || 50,
        taxRate: data.taxRate || 0,
        cardFeeRate: data.cardFeeRate || 0,
        targetMonthlyProfit: data.targetMonthlyProfit || 0,
        psychologicalPricingPattern: data.psychologicalPricingPattern || '90',
        financialDisplayMode: data.financialDisplayMode || 'simple',
        marginThresholdWarning: data.marginThresholdWarning ?? 20,
        marginThresholdOptimal: data.marginThresholdOptimal ?? 40,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: 'tenantId' }
    )

    if (error) throw error

    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/configuracoes'])
    }
    return actionSuccess('Configurações salvas com sucesso!')
  } catch (error) {
    console.error(error)
    return actionError('Erro ao salvar configurações')
  }
}

export async function getSettings() {
  const user = await getCurrentUser()
  const defaultSettings = {
    id: 'temp-id',
    tenantId: user?.tenantId || 'temp',
    storeName: 'Atelis',
    hourlyRate: 20,
    primaryColor: DEFAULT_THEME,
    phone: null,
    email: null,
    instagram: null,
    facebook: null,
    msgQuotation: null,
    msgReady: null,
    msgApproved: null,
    msgFinished: null,
    logoUrl: null,
    addressStreet: null,
    addressNumber: null,
    addressComplement: null,
    addressNeighborhood: null,
    addressCity: null,
    addressState: null,
    addressZip: null,
    quotationValidityDays: 15,
    defaultQuotationNotes: null,
    monthlyFixedCosts: [],
    desirableSalary: 2000,
    workingHoursPerMonth: 160,
    defaultProfitMargin: 50,
    taxRate: 0,
    cardFeeRate: 0,
    targetMonthlyProfit: 0,
    psychologicalPricingPattern: '90',
    financialDisplayMode: 'simple',
    marginThresholdWarning: 20,
    marginThresholdOptimal: 40,
    updatedAt: new Date(),
  }

  if (!user) return defaultSettings

  const db = await createClient()
  const { data: settings } = await db
    .from('Settings')
    .select('*')
    .eq('tenantId', user.tenantId)
    .single()

  if (!settings) return defaultSettings

  const settingsData = settings as SettingsRecord

  return {
    ...defaultSettings,
    ...settingsData,
    hourlyRate: Number(settingsData.hourlyRate),
    whatsappPhoneNumberId: settingsData.whatsappPhoneNumberId || '',
    whatsappAccessToken: settingsData.whatsappAccessToken || '',
    whatsappConfigVerified: settingsData.whatsappConfigVerified || false,
    financialDisplayMode: settingsData.financialDisplayMode || 'simple',
    marginThresholdWarning: Number(settingsData.marginThresholdWarning) || 20,
    marginThresholdOptimal: Number(settingsData.marginThresholdOptimal) || 40,
    taxRate: Number(settingsData.taxRate) || 0,
    cardFeeRate: Number(settingsData.cardFeeRate) || 0,
    targetMonthlyProfit: Number(settingsData.targetMonthlyProfit) || 0,
  }
}
