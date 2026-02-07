/**
 * Multi-Tenancy Usage Guide
 * 
 * The Prisma middleware automatically filters all queries by tenantId.
 * You don't need to manually add tenantId to queries.
 * 
 * Example Server Action:
 */

import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTenantMiddleware } from '@/lib/prisma-middleware'

export async function exampleServerAction() {
    // 1. Get current user (includes tenant info)
    const user = await getCurrentUser()

    if (!user || !user.tenantId) {
        return { success: false, message: 'Não autorizado' }
    }

    // 2. Check tenant status
    if (user.tenant.status !== 'active') {
        return { success: false, message: 'Conta suspensa' }
    }

    // 3. Apply middleware for this request
    prisma.$use(createTenantMiddleware(user.tenantId))

    // 4. Now all queries are automatically filtered by tenantId
    const customers = await prisma.customer.findMany()
    // This will only return customers for the current tenant

    const orders = await prisma.order.findMany({
        where: {
            status: 'pending'
            // No need to add tenantId here, middleware handles it
        }
    })

    // 5. Creates are also automatically tagged with tenantId
    const newCustomer = await prisma.customer.create({
        data: {
            name: 'New Customer',
            // No need to add tenantId, middleware adds it automatically
        }
    })

    return { success: true, data: { customers, orders } }
}

/**
 * Important Notes:
 * 
 * 1. Always call getCurrentUser() first
 * 2. Always check user.tenant.status
 * 3. Apply middleware with prisma.$use(createTenantMiddleware(user.tenantId))
 * 4. All subsequent queries are automatically filtered
 * 5. Middleware prevents cross-tenant data access
 */
