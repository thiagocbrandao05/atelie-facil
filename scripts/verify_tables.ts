import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('Checking WhatsAppLimits table...')
  const { data, error } = await supabase.from('WhatsAppLimits').select('*').limit(1)

  if (error) {
    console.error('Error selecting from WhatsAppLimits:', error.message)
    if (error.code === '42P01') {
      // undefined_table
      console.log('CONFIRMED: Table does not exist.')
    }
  } else {
    console.log('Success: Table exists.')
  }

  console.log('Checking WhatsAppUsageDaily table...')
  const { error: error2 } = await supabase.from('WhatsAppUsageDaily').select('*').limit(1)

  if (error2) {
    console.error('Error selecting from WhatsAppUsageDaily:', error2.message)
  } else {
    console.log('Success: Table WhatsAppUsageDaily exists.')
  }
}

main()
