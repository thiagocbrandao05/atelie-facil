import { createClient } from './src/lib/supabase/server'

async function testPublicOrder() {
    const publicId = 'd56af450-1f5f-4390-87b1-91f1f5fac515'
    const supabase = await createClient()

    console.log('--- Testing RPC get_public_order ---')
    const { data, error } = await (supabase as any).rpc('get_public_order', {
        p_public_id: publicId,
    })

    if (error) {
        console.error('RPC Error:', error)
    } else {
        console.log('RPC Data count:', data?.length)
        console.log('RPC Data:', JSON.stringify(data, null, 2))
    }
}

testPublicOrder()
