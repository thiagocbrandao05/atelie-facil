'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Send, Plus, ExternalLink } from 'lucide-react'
import { sendCampaign } from '../actions'
import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

type CampaignListItem = {
  id: string
  name: string
  status: 'DRAFT' | 'SENT' | string
  messageText: string
  campaignToken: string
  recipients?: Array<{ count?: number }> | null
}

export function CampaignList({ campaigns }: { campaigns: CampaignListItem[] }) {
  const [sending, setSending] = useState<string | null>(null)

  const handleSend = async (campaignId: string) => {
    setSending(campaignId)
    try {
      const res = await sendCampaign(campaignId)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (e) {
      toast.error('Erro ao enviar campanha.')
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {campaigns.map(camp => (
        <Card key={camp.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="truncate text-base font-bold">{camp.name}</CardTitle>
            <Badge variant={camp.status === 'DRAFT' ? 'outline' : 'secondary'}>{camp.status}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem] text-xs">
              {camp.messageText}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm font-medium">
                {camp.recipients ? camp.recipients[0]?.count : 0} destinatários
              </div>
              <div className="flex gap-2">
                <Link href={`/campanha/${camp.campaignToken}`} target="_blank">
                  <Button variant="ghost" size="icon" title="Ver Link Público">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => handleSend(camp.id)}
                  disabled={sending === camp.id}
                >
                  {sending === camp.id ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="mr-2 h-3 w-3" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
