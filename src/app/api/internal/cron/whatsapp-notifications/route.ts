import { NextResponse } from 'next/server'

import { processPendingWhatsAppNotifications } from '@/features/whatsapp/actions'

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processPendingWhatsAppNotifications({ useAdmin: true })

  return NextResponse.json(result)
}
