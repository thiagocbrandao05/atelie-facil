'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { CustomerSchema } from "@/lib/schemas"
import type { ActionResponse } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"
import { logAction } from "@/lib/audit"
import { validateCSRF } from "@/lib/security"

async function assertCSRFValid() {
    const csrf = await validateCSRF()
    if (!csrf.valid) {
        return { success: false, message: csrf.error || 'CSRF inválido.' }
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

    return (data as any[]) || []
}

export async function createCustomer(prevState: ActionResponse, formData: FormData): Promise<ActionResponse> {
    const csrfError = await assertCSRFValid()
    if (csrfError) return csrfError

    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    const data = {
        name: formData.get('name'),
        phone: formData.get('phone') || undefined,
        email: formData.get('email') || undefined,
        address: formData.get('address') || undefined,
        notes: formData.get('notes') || undefined,
    }
    const validatedFields = CustomerSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Dados inválidos.',
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    try {
        const supabase = await createClient()
        const { data: customer, error } = await supabase
            .from('Customer')
            .insert({
                ...validatedFields.data,
                tenantId: user.tenantId
            } as any)
            .select()
            .single<any>()

        if (error) throw error

        // Audit log (TODO: Audit log via Supabase directly or refactor logAction)
        await logAction(
            user.tenantId,
            user.id,
            'CREATE',
            'Customer',
            customer.id,
            { name: validatedFields.data.name, email: validatedFields.data.email }
        )

        revalidatePath('/clientes')
        return { success: true, message: 'Cliente cadastrado!', data: customer }
    } catch (e: any) {
        console.error('Failed to create customer:', e)
        return { success: false, message: 'Erro ao cadastrar cliente.' }
    }
}

export async function deleteCustomer(id: string): Promise<ActionResponse> {
    const csrfError = await assertCSRFValid()
    if (csrfError) return csrfError

    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('Customer')
            .delete()
            .eq('id', id)
        // RLS ensures tenant isolation, but eq id is enough

        if (error) throw error

        // Audit log
        await logAction(
            user.tenantId,
            user.id,
            'DELETE',
            'Customer',
            id
        )

        revalidatePath('/clientes')
        // Using redirect in client component instead of here for deletions usually, 
        // but ActionResponse message handles it.
        return { success: true, message: 'Cliente removido!' }
    } catch (e) {
        return { success: false, message: 'Erro ao remover cliente. Verifique se ele possui pedidos.' }
    }
}

export async function updateCustomer(id: string, prevState: ActionResponse, formData: FormData): Promise<ActionResponse> {
    const csrfError = await assertCSRFValid()
    if (csrfError) return csrfError

    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    const data = {
        name: formData.get('name'),
        phone: formData.get('phone') || undefined,
        email: formData.get('email') || undefined,
        address: formData.get('address') || undefined,
        notes: formData.get('notes') || undefined,
    }
    const validatedFields = CustomerSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Dados inválidos.',
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('Customer')
            .update(validatedFields.data as any as never)
            .eq('id', id)
        // RLS handles tenant protection

        if (error) throw error

        // Audit log
        await logAction(
            user.tenantId,
            user.id,
            'UPDATE',
            'Customer',
            id,
            validatedFields.data
        )

        revalidatePath('/clientes')
        return { success: true, message: 'Cliente atualizado!' }
    } catch (e) {
        console.error('Failed to update customer:', e)
        return { success: false, message: 'Erro ao atualizar cliente.' }
    }
}


export async function getCustomerOrders(customerId: string) {
    const user = await getCurrentUser()
    if (!user) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('Order')
        .select(`
            id,
            status,
            totalValue,
            createdAt,
            items:OrderItem(
                productId,
                quantity,
                product:Product(name)
            )
        `)
        .eq('tenantId', user.tenantId)
        .eq('customerId', customerId)
        .order('createdAt', { ascending: false })

    if (error) {
        console.error('Error fetching customer orders:', error)
        return []
    }

    return (data as any[]) || []
}
