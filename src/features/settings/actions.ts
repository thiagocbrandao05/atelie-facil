'use server'

import { z } from 'zod'
import { revalidatePath, unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { DEFAULT_THEME } from '@/lib/theme-tokens'

const ProfileSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email inválido"),
})

const SettingsSchema = z.object({
    storeName: z.string().min(2, "Nome da loja deve ter pelo menos 2 caracteres"),
    hourlyRate: z.coerce.number().min(0, "Valor deve ser positivo"),
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
    // Redesign specific fields
    quotationValidityDays: z.coerce.number().optional(),
    defaultQuotationNotes: z.string().optional(),
    monthlyFixedCosts: z.string().optional(), // Expected as JSON string from form
    desirableSalary: z.coerce.number().optional(),
    workingHoursPerMonth: z.coerce.number().optional(),
    defaultProfitMargin: z.coerce.number().optional(),
})

export async function updateProfile(prevState: any, formData: FormData) {
    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, message: 'Não autorizado' }

        const data = ProfileSchema.parse({
            name: formData.get('name'),
            email: formData.get('email'),
        })

        const supabase = await createClient()
        const { error } = await supabase
            .from('User')
            .update({
                name: data.name,
                email: data.email
            } as any as never)
            .eq('id', user.id)

        if (error) throw error

        revalidatePath('/dashboard/perfil')
        return { success: true, message: 'Perfil atualizado com sucesso!' }
    } catch (error) {
        return { success: false, message: 'Erro ao atualizar perfil' }
    }
}

export async function updateSettings(prevState: any, formData: FormData) {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado.' }

    try {
        const tenantId = user.tenantId

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
        })

        const supabase = await createClient()

        // Parse fixed costs JSON
        let fixedCosts = []
        try {
            fixedCosts = data.monthlyFixedCosts ? JSON.parse(data.monthlyFixedCosts) : []
        } catch (e) {
            console.error('Failed to parse fixed costs', e)
        }

        // Upsert settings using onConflict tenantId
        const { error } = await supabase
            .from('Settings')
            .upsert({
                tenantId: tenantId,
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
                updatedAt: new Date().toISOString()
            } as any, { onConflict: 'tenantId' })

        if (error) throw error

        revalidatePath('/dashboard/configuracoes')
        return { success: true, message: 'Configurações salvas com sucesso!' }
    } catch (error) {
        console.error(error)
        return { success: false, message: 'Erro ao salvar configurações' }
    }
}

export async function getSettings() {
    const user = await getCurrentUser()
    const defaultSettings = {
        id: 'temp-id',
        tenantId: user?.tenantId || 'temp',
        storeName: 'Ateliê Fácil',
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
        updatedAt: new Date()
    }

    if (!user) return defaultSettings

    const supabase = await createClient()
    const { data: settings } = await supabase
        .from('Settings')
        .select('*')
        .eq('tenantId', user.tenantId)
        .single()

    if (!settings) return defaultSettings

    return {
        ...defaultSettings,
        ...(settings as any),
        hourlyRate: Number((settings as any).hourlyRate)
    }
}

