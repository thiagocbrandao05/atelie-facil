'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { validateWhatsAppCredentials, sendWhatsAppMessage } from '@/features/whatsapp/actions'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'

type CreateCampaignInput = {
  name: string
  messageText: string
  imageUrl?: string
  recipientIds: string[]
}

export async function createCampaign(input: CreateCampaignInput) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const supabase = await createClient()

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
    return actionError('Erro ao criar campanha.')
  }

  const recipientsData = input.recipientIds.map(customerId => ({
    campaignId: campaign.id,
    customerId,
    status: 'PENDING',
  }))

  if (recipientsData.length > 0) {
    const { error: recipientError } = await (supabase as any)
      .from('CampaignRecipient')
      .insert(recipientsData)

    if (recipientError) {
      console.error('Error adding recipients:', recipientError)
      return actionError('Campanha criada, mas erro ao adicionar destinatários.')
    }
  }

  const slug = user.tenant?.slug
  if (slug) {
    revalidateWorkspaceAppPaths(slug, ['/configuracoes/campanhas'])
  }

  return actionSuccess('Campanha criada com sucesso!', { campaignId: (campaign as any).id })
}

export async function sendCampaign(campaignId: string) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const credsCheck = await validateWhatsAppCredentials()
  if (!credsCheck.success) {
    return actionError('Credenciais do WhatsApp inválidas. Verifique configurações.')
  }

  const supabase = await createClient()

  const { data: campaign } = await (supabase as any)
    .from('Campaign')
    .select('*')
    .eq('id', campaignId)
    .single()
  if (!campaign) return actionError('Campanha não encontrada.')

  const { data: recipients } = await (supabase as any)
    .from('CampaignRecipient')
    .select('*, customer:Customer(phone, name)')
    .eq('campaignId', campaignId)
    .eq('status', 'PENDING')

  if (!recipients || recipients.length === 0) {
    return actionSuccess('Não há destinatários pendentes para envio.', {
      stats: { successCount: 0, failureCount: 0 },
    })
  }

  try {
    await import('@/features/whatsapp/limits').then(m =>
      m.ensureCanSendCampaign(user.tenantId, recipients.length)
    )
  } catch (error: any) {
    return actionError(error.message)
  }

  let successCount = 0
  let failureCount = 0

  const publicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ateliefacil.com'}/${user.tenant?.slug}/s/campanha/${(campaign as any).campaignToken}`

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

    let message = campaign.messageText
    message = message.replace('{cliente}', customer.name).replace('{link}', publicLink)
    if (!message.includes(publicLink) && !message.includes('{link}')) {
      message += `\n\nVeja mais: ${publicLink}`
    }

    const result = await sendWhatsAppMessage({
      phone: customer.phone,
      message,
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

  if (successCount > 0) {
    await import('@/features/whatsapp/limits').then(m =>
      m.incrementWhatsAppUsage(user.tenantId, 'campaign', successCount)
    )
  }

  return actionSuccess(`Envio processado. Sucesso: ${successCount}, Falhas: ${failureCount}`, {
    stats: { successCount, failureCount },
  })
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
      sentAt,
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
