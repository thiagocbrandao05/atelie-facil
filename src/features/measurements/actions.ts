'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const MeasurementSchema = z.object({
    customerId: z.string().uuid(),
    name: z.string().min(1, "Nome da medida é obrigatório"),
    value: z.string().min(1, "Valor é obrigatório"),
    unit: z.string().optional(),
    notes: z.string().optional(),
})

export async function createMeasurement(prevState: any, formData: FormData) {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    try {
        const data = MeasurementSchema.parse({
            customerId: formData.get('customerId'),
            name: formData.get('name'),
            value: formData.get('value'),
            unit: formData.get('unit'),
            notes: formData.get('notes'),
        })

        const supabase = await createClient()
        const { error } = await supabase
            .from('CustomerMeasurements')
            .insert({
                ...data,
                tenantId: user.tenantId
            } as any)

        if (error) throw error

        revalidatePath(`/dashboard/clientes`)
        return { success: true, message: 'Medida adicionada com sucesso!' }
    } catch (error) {
        console.error(error)
        return { success: false, message: 'Erro ao adicionar medida' }
    }
}

export async function getMeasurements(customerId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('CustomerMeasurements')
        .select('*')
        .eq('customerId', customerId)
        .order('createdAt', { ascending: false })

    if (error) {
        console.error(error)
        return []
    }

    return data as any[]
}

export async function deleteMeasurement(id: string) {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    const supabase = await createClient()
    const { error } = await supabase
        .from('CustomerMeasurements')
        .delete()
        .eq('id', id)
        .eq('tenantId', user.tenantId)

    if (error) return { success: false, message: 'Erro ao excluir medida' }

    revalidatePath(`/dashboard/clientes`)
    return { success: true, message: 'Medida excluída!' }
}
