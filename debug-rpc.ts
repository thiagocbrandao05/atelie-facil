import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nikyeqzzasbyzlbvevuu.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pa3llcXp6YXNieXpsYnZldnV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc1MjgzNCwiZXhwIjoyMDg2MzI4ODM0fQ.qJy5Bgw9otHtVszChiy2kdM77jjXXqJP1PSihhnS03g'

async function debug() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    const publicId = 'd56af450-1f5f-4390-87b1-91f1f5fac515'

    console.log('Testing RPC get_public_order...')
    const { data, error } = await supabase.rpc('get_public_order', {
        p_public_id: publicId
    })

    if (error) {
        console.log('Error Type:', typeof error)
        console.log('Error Keys:', Object.keys(error))
        console.log('Error Content:', JSON.stringify(error, null, 2))
        console.log('Error Message:', error.message)
        console.log('Error Details:', error.details)
        console.log('Error Hint:', error.hint)
        console.log('Error Code:', error.code)
    } else {
        console.log('Success!')
        console.log('Data count:', data?.length)
        console.log('First result:', JSON.stringify(data?.[0], null, 2))
    }
}

debug()
