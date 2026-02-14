import { createClient } from './src/lib/supabase/server'

async function debug() {
    const supabase = await createClient()

    console.log('--- Checking Settings ---')
    const { data: settings, error: sError } = await (supabase as any)
        .from('Settings')
        .select('*')
        .limit(1)

    if (sError) console.error('Settings Error:', sError)
    else console.log('Settings keys:', Object.keys(settings[0] || {}))

    console.log('--- Checking Order ---')
    const { data: orders, error: oError } = await (supabase as any)
        .from('Order')
        .select('*')
        .limit(1)

    if (oError) console.error('Order Error:', oError)
    else {
        console.log('Order keys:', Object.keys(orders[0] || {}))
        console.log('Sample Order Status:', orders[0]?.status)
        console.log('Sample Order Number:', orders[0]?.orderNumber)
    }
}

debug()
