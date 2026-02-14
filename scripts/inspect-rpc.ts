import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function check() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase.rpc('pg_get_functiondef', {
        p_name: 'get_material_balance_v2'
    })

    // Alternatively, query pg_proc directly if pg_get_functiondef is not accessible via RPC
    const { data: rawDef, error: rawError } = await supabase
        .from('_rpc_helper' as any) // Dummy
        .select('*')
        .filter('routine_name', 'eq', 'get_material_balance_v2') as any

    // Final fallback: try to just describe it
    const { data: proc, error: procError } = await supabase.rpc('inspect_function' as any, { name: 'get_material_balance_v2' })

    console.log('RPC Info:', data || error || proc || procError)
}

check()
