/**
 * Multi-tenancy preparation utilities
 * Currently single-tenant, but structured for future multi-tenant support
 */

export interface TenantConfig {
    id: string
    name: string
    slug: string
    settings: {
        hourlyRate: number
        currency: string
        locale: string
        timezone: string
        features: {
            inventory: boolean
            reports: boolean
            whatsapp: boolean
            multiUser: boolean
        }
    }
    branding?: {
        logo?: string
        primaryColor?: string
        secondaryColor?: string
    }
}

/**
 * Default tenant configuration
 */
export const DEFAULT_TENANT: TenantConfig = {
    id: 'default',
    name: 'Ateliê Fácil',
    slug: 'default',
    settings: {
        hourlyRate: 20,
        currency: 'BRL',
        locale: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        features: {
            inventory: true,
            reports: true,
            whatsapp: true,
            multiUser: false
        }
    }
}

/**
 * Get current tenant (for now, always returns default)
 * In future: extract from subdomain, path, or user session
 */
export function getCurrentTenant(): TenantConfig {
    // TODO: Implement tenant resolution logic
    // Options:
    // 1. Subdomain: tenant.ateliefacil.com
    // 2. Path: /tenant/slug
    // 3. User session: user.tenantId

    return DEFAULT_TENANT
}

/**
 * Check if feature is enabled for current tenant
 */
export function isFeatureEnabled(feature: keyof TenantConfig['settings']['features']): boolean {
    const tenant = getCurrentTenant()
    return tenant.settings.features[feature]
}

/**
 * Get tenant-specific setting
 */
export function getTenantSetting<K extends keyof TenantConfig['settings']>(
    key: K
): TenantConfig['settings'][K] {
    const tenant = getCurrentTenant()
    return tenant.settings[key]
}

/**
 * Tenant context for database queries
 * Add this to Prisma queries when implementing multi-tenancy
 */
export function getTenantContext() {
    const tenant = getCurrentTenant()
    return {
        tenantId: tenant.id
    }
}

/**
 * Validate tenant access
 * Use in middleware to ensure user has access to tenant
 */
export function validateTenantAccess(userId: string, tenantId: string): boolean {
    // TODO: Implement actual validation
    // Check if user belongs to tenant
    return true
}


