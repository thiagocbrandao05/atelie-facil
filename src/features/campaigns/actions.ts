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

type CampaignRecord = {
  id: string
  campaignToken: string
  messageText: string
  imageUrl?: string | null
}

type CampaignRecipientRecord = {
  id: string
  customer?: {
    phone?: string | null
    name?: string | null
  } | null
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Erro desconhecido'
}

export async function createCampaign(input: CreateCampaignInput) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const supabase = await createClient()

  const { data: campaign, error: campaignError } = await supabase
    .from('Campaign')
    // @ts-expect-error legacy schema not fully represented in generated DB types
    .insert({
      tenantId: user.tenantId,
      name: input.name,
      messageText: input.messageText,
      imageUrl: input.imageUrl,
      status: 'DRAFT',
    })
    .select()
    .single()

  const campaignRecord = campaign as CampaignRecord | null
  if (campaignError || !campaignRecord) {
    console.error('Error creating campaign:', campaignError)
    return actionError('Erro ao criar campanha.')
  }

  const recipientsData = input.recipientIds.map(customerId => ({
    campaignId: campaignRecord.id,
    customerId,
    status: 'PENDING',
  }))

  if (recipientsData.length > 0) {
    const { error: recipientError } = await supabase
      .from('CampaignRecipient')
      .insert(recipientsData as never)

    if (recipientError) {
      console.error('Error adding recipients:', recipientError)
      return actionError('Campanha criada, mas erro ao adicionar destinatarios.')
    }
  }

  const slug = user.tenant?.slug
  if (slug) {
    revalidateWorkspaceAppPaths(slug, ['/configuracoes/campanhas'])
  }

  return actionSuccess('Campanha criada com sucesso!', { campaignId: campaignRecord.id })
}

export async function sendCampaign(campaignId: string) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const credsCheck = await validateWhatsAppCredentials()
  if (!credsCheck.success) {
    return actionError('Credenciais do WhatsApp invalidas. Verifique configuracoes.')
  }

  const supabase = await createClient()

  const { data: campaign } = await supabase
    .from('Campaign')
    .select('*')
    .eq('id', campaignId)
    .single()
  const campaignRecord = campaign as CampaignRecord | null
  if (!campaignRecord) return actionError('Campanha nao encontrada.')

  const { data: recipients } = await supabase
    .from('CampaignRecipient')
    .select('*, customer:Customer(phone, name)')
    .eq('campaignId', campaignId)
    .eq('status', 'PENDING')

  const recipientsList = (recipients || []) as CampaignRecipientRecord[]
  if (recipientsList.length === 0) {
    return actionSuccess('Nao ha destinatarios pendentes para envio.', {
      stats: { successCount: 0, failureCount: 0 },
    })
  }

  try {
    await import('@/features/whatsapp/limits').then(m =>
      m.ensureCanSendCampaign(user.tenantId, recipientsList.length)
    )
  } catch (error: unknown) {
    return actionError(getErrorMessage(error))
  }

  let successCount = 0
  let failureCount = 0

  const publicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ateliefacil.com'}/campanha/${campaignRecord.campaignToken}`

  for (const recipient of recipientsList) {
    const customer = recipient.customer
    if (!customer?.phone) {
      await updateRecipientStatus(supabase, recipient.id, 'FAILED', 'Telefone nao cadastrado')
      failureCount++
      continue
    }

    let message = campaignRecord.messageText
    message = message.replace('{cliente}', customer.name || 'cliente').replace('{link}', publicLink)
    if (!message.includes(publicLink) && !message.includes('{link}')) {
      message += `\n\nVeja mais: ${publicLink}`
    }

    const result = await sendWhatsAppMessage({
      phone: customer.phone,
      message,
      imageUrl: campaignRecord.imageUrl || undefined,
    })

    if (result.success) {
      await updateRecipientStatus(supabase, recipient.id, 'SENT', null, new Date().toISOString())
      successCount++
    } else {
      await updateRecipientStatus(supabase, recipient.id, 'FAILED', result.message)
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
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  status: string,
  errorMsg?: string | null,
  sentAt?: string
) {
  await supabase
    .from('CampaignRecipient')
    // @ts-expect-error legacy schema not fully represented in generated DB types
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

  const { data } = await supabase
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
