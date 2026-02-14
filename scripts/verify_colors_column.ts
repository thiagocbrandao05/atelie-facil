
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    console.log('Checking Material table columns...')

    // Try to select the colors column specifically
    const { data, error } = await supabase
        .from('Material')
        .select('id, colors')
        .limit(1)

    if (error) {
        console.error('Check failed:', error.message)
        console.error('Details:', error)
    } else {
        console.log('Column colors exists and is accessible!')
        console.log('Sample data:', data)
    }
}

check()
