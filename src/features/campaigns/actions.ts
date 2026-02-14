'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { validateWhatsAppCredentials, sendWhatsAppMessage } from '@/features/whatsapp/actions'
import { Campaign, CampaignRecipient } from '@/lib/types'

type CreateCampaignInput = {
  name: string
  messageText: string
  imageUrl?: string
  recipientIds: string[] // Customer IDs
}

export async function createCampaign(input: CreateCampaignInput) {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado.' }

  const supabase = await createClient()

  // 1. Create Campaign
  const { data: campaign, error: campaignError } = await (supabase as any)
    .from('Campaign')
    .insert({
      tenantId: user.tenantId,
      name: input.name,
      messageText: input.messageText,
      imageUrl: input.imageUrl,
      status: 'DRAFT',
    })
    .select()
    .single()

  if (campaignError || !campaign) {
    console.error('Error creating campaign:', campaignError)
    return { success: false, message: 'Erro ao criar campanha.' }
  }

  // 2. Create Recipients
  const recipientsData = input.recipientIds.map(customerId => ({
    campaignId: campaign.id,
    customerId: customerId,
    status: 'PENDING',
  }))

  if (recipientsData.length > 0) {
    const { error: recipientError } = await (supabase as any)
      .from('CampaignRecipient')
      .insert(recipientsData)

    if (recipientError) {
      console.error('Error adding recipients:', recipientError)
      // Rollback? ideally yes, but for now just warn. User can retry or delete.
      return { success: false, message: 'Campanha criada, mas erro ao adicionar destinatários.' }
    }
  }

  revalidatePath(`/${(user as any).tenant?.slug}/app/configuracoes/campanhas`)
  return {
    success: true,
    message: 'Campanha criada com sucesso!',
    campaignId: (campaign as any).id,
  }
}

export async function sendCampaign(campaignId: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado.' }

  // Check credentials first
  const credsCheck = await validateWhatsAppCredentials()
  if (!credsCheck.success) {
    return {
      success: false,
      message: 'Credenciais do WhatsApp inválidas. Verifique configurações.',
    }
  }

  const supabase = await createClient()

  // 1. Fetch Campaign and Pending Recipients
  const { data: campaign } = await (supabase as any)
    .from('Campaign')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!campaign) return { success: false, message: 'Campanha não encontrada.' }

  const { data: recipients } = await (supabase as any)
    .from('CampaignRecipient')
    .select('*, customer:Customer(phone, name)')
    .eq('campaignId', campaignId)
    .eq('status', 'PENDING')
  // Limit batch size if needed, e.g. .limit(50)

  if (!recipients || recipients.length === 0) {
    return {
      success: true,
      message: 'Não há destinatários pendentes para envio.',
      stats: { successCount: 0, failureCount: 0 },
    }
  }

  try {
    await import('@/features/whatsapp/limits').then(m =>
      m.ensureCanSendCampaign(user.tenantId, recipients.length)
    )
  } catch (error: any) {
    return { success: false, message: error.message }
  }

  // 2. Process Sending (In a real background job, this would be queued)
  // For MVP, we iterate here (beware of timeouts for large lists)

  let successCount = 0
  let failureCount = 0

  // Generate Public Campaign Link
  const publicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ateliefacil.com'}/${(user as any).tenant?.slug}/s/campanha/${(campaign as any).campaignToken}`

  for (const recipient of recipients) {
    const customer = (recipient as any).customer
    if (!customer?.phone) {
      await updateRecipientStatus(
        supabase,
        (recipient as any).id,
        'FAILED',
        'Telefone não cadastrado'
      )
      failureCount++
      continue
    }

    // Replace placeholders if any
    let message = campaign.messageText
    message = message.replace('{cliente}', customer.name).replace('{link}', publicLink)

    // Append link if not present and no placeholders used?
    // Strategy: Force append link at end if not in text?
    // Let's assume user puts {link} or we append it.
    if (!message.includes(publicLink) && !message.includes('{link}')) {
      message += `\n\nVeja mais: ${publicLink}`
    }

    const result = await sendWhatsAppMessage({
      phone: customer.phone,
      message: message,
      imageUrl: (campaign as any).imageUrl || undefined,
    })

    if (result.success) {
      await updateRecipientStatus(
        supabase,
        (recipient as any).id,
        'SENT',
        null,
        new Date().toISOString()
      )
      successCount++
    } else {
      await updateRecipientStatus(supabase, (recipient as any).id, 'FAILED', result.message)
      failureCount++
    }
  }

  // Increment Usage
  if (successCount > 0) {
    await import('@/features/whatsapp/limits').then(m =>
      m.incrementWhatsAppUsage(user.tenantId, 'campaign', successCount)
    )
  }

  // Update Campaign Status if all done?
  // Simplified: always return summary
  return {
    success: true,
    message: `Envio processado. Sucesso: ${successCount}, Falhas: ${failureCount}`,
    stats: { successCount, failureCount },
  }
}

async function updateRecipientStatus(
  supabase: any,
  id: string,
  status: string,
  errorMsg?: string | null,
  sentAt?: string
) {
  await supabase
    .from('CampaignRecipient')
    .update({
      status,
      errorMessage: errorMsg,
      sentAt: sentAt,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)
}

export async function getCampaigns() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()

  const { data } = await (supabase as any)
    .from('Campaign')
    .select(
      `
            *,
            recipients:CampaignRecipient(count)
        `
    )
    .eq('tenantId', user.tenantId)
    .order('createdAt', { ascending: false })

  return data || []
}
