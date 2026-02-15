import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

type Props = {
  params: Promise<{
    campaignToken: string
  }>
}

type PublicCampaignRow = {
  name: string
  imageUrl?: string | null
  tenantName: string
  messageText: string
}

export default async function PublicCampaignPage({ params }: Props) {
  const { campaignToken } = await params
  const supabase = await createClient()

  // @ts-expect-error legacy rpc typing missing in generated Database type
  const { data: campaign, error } = await supabase.rpc('get_public_campaign', {
    p_token: campaignToken,
  })
  const campaignRows = (campaign || []) as PublicCampaignRow[]

  if (error || campaignRows.length === 0) {
    notFound()
  }

  const data = campaignRows[0]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-0 md:p-4">
      <div className="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl md:aspect-[9/16] md:min-h-0 md:rounded-xl">
        <div className="relative aspect-square w-full bg-gray-100">
          {data.imageUrl ? (
            <Image src={data.imageUrl} alt={data.name} fill className="object-cover" priority />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              Sem imagem
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="text-muted-foreground mb-2 text-xs font-bold tracking-widest uppercase">
            {data.tenantName}
          </div>
          <h1 className="mb-4 text-2xl leading-tight font-bold">{data.name}</h1>

          <div className="prose prose-sm mb-8 flex-1 whitespace-pre-wrap text-gray-600">
            {data.messageText}
          </div>

          <a
            href={`https://wa.me/?text=Ol%C3%A1%2C%20vim%20pela%20campanha%20${encodeURIComponent(data.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button className="h-12 w-full transform gap-2 rounded-full bg-[#25D366] text-lg font-bold text-white shadow-lg transition-all hover:bg-[#128C7E] active:scale-95">
              <MessageCircle className="h-6 w-6" />
              Falar no WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}
