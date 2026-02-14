/**
 * Script to create test user in Supabase
 * Loads environment variables manually to avoid issues
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Parse .env.local manually
const envPath = join(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')

const env: Record<string, string> = {}
envContent.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        env[key] = valueParts.join('=')
    }
})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Environment check:')
console.log(`   SUPABASE_URL: ${SUPABASE_URL ? '✅ Set' : '❌ Missing'}`)
console.log(`   SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`)
console.log('')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables in .env.local')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

const TEST_USER = {
    email: 'test@ateliefacil.com.br',
    password: 'TestPassword123!',
    tenantName: 'Ateliê Teste',
    tenantSlug: 'atelie-teste',
}

async function createTestUser() {
    console.log('🔧 Creating test user...\n')

    try {
        // 1. Get or create auth user
        console.log('1️⃣ Getting/Creating auth user...')

        let userId: string

        // Check if user already exists
        const { data: allUsers } = await supabase.auth.admin.listUsers()
        const existingAuthUser = allUsers.users.find(u => u.email === TEST_USER.email)

        if (existingAuthUser) {
            console.log('   ⚠️  Auth user already exists')
            userId = existingAuthUser.id
            console.log(`   ✅ Using existing user: ${userId}`)

            // Check if tenant already exists
            const { data: existingTenant } = await supabase
                .from('Tenant')
                .select('*')
                .eq('slug', TEST_USER.tenantSlug)
                .single()

            if (existingTenant) {
                console.log('\n✅ Test user already configured!')
                console.log('\n📧 Credentials:')
                console.log(`   Email: ${TEST_USER.email}`)
                console.log(`   Password: ${TEST_USER.password}`)
                console.log(`\n🏢 Tenant: ${existingTenant.name}`)
                console.log(`\n🌐 http://localhost:3000/${existingTenant.slug}/app/dashboard`)
                return
            }
        } else {
            // Create new auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: TEST_USER.email,
                password: TEST_USER.password,
                email_confirm: true,
            })

            if (authError) {
                throw authError
            }

            userId = authData.user.id
            console.log(`   ✅ User created: ${userId}`)
        }

        // 2. Create tenant
        console.log('\n2️⃣ Creating tenant...')
        const { data: tenant, error: tenantError } = await supabase
            .from('Tenant')
            .insert({
                name: TEST_USER.tenantName,
                slug: TEST_USER.tenantSlug,
                updatedAt: new Date().toISOString(),
            })
            .select()
            .single()

        if (tenantError) {
            console.error('   ❌ Error:', tenantError.message)
            throw tenantError
        }
        console.log(`   ✅ Tenant created: ${tenant.id}`)

        // 3. Create User record (maps auth.users to User table)
        console.log('\n3️⃣ Creating User record...')
        const { error: userError } = await supabase.from('User').insert({
            id: userId,
            tenantId: tenant.id,
            email: TEST_USER.email,
            name: 'Test User',
            role: 'admin',
            updatedAt: new Date().toISOString(),
        })

        if (userError) {
            console.error('   ❌ Error:', userError.message)
            throw userError
        }
        console.log('   ✅ User record created')

        // 4. Create default Settings for tenant
        console.log('\n4️⃣ Creating default settings...')
        const { error: settingsError } = await supabase.from('Settings').insert({
            tenantId: tenant.id,
            storeName: TEST_USER.tenantName,
            updatedAt: new Date().toISOString(),
        })

        if (settingsError) {
            console.error('   ❌ Error:', settingsError.message)
            // Non-critical, continue
        } else {
            console.log('   ✅ Settings created')
        }

        console.log('\n🎉 Test user created successfully!\n')
        console.log('📧 Credentials:')
        console.log(`   Email: ${TEST_USER.email}`)
        console.log(`   Password: ${TEST_USER.password}`)
        console.log(`\n🏢 Tenant: ${TEST_USER.tenantName}`)
        console.log(`\n🌐 http://localhost:3000/${TEST_USER.tenantSlug}/app/dashboard`)
        console.log('\n💡 Add to .env.local:')
        console.log(`TEST_USER_EMAIL=${TEST_USER.email}`)
        console.log(`TEST_USER_PASSWORD=${TEST_USER.password}`)
    } catch (error: any) {
        console.error('\n❌ Error:', error.message || error)
        process.exit(1)
    }
}

createTestUser()
