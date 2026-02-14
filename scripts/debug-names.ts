import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function check() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: settings, error } = await supabase
        .from('Settings')
        .select('storeName, tenantId')
        .limit(5)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Settings Found:')
    settings?.forEach(s => console.log(`- Tenant: ${s.tenantId} | Name: ${s.storeName}`))

    const { data: tenants } = await supabase
        .from('Tenant')
        .select('id, name')

    console.log('\nTenants Found:')
    tenants?.forEach(t => console.log(`- ID: ${t.id} | Name: ${t.name}`))
}

check()
