import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCampaigns } from '@/features/campaigns/actions'
import { CampaignBuilder } from '@/features/campaigns/components/campaign-builder'
import { CampaignList } from '@/features/campaigns/components/campaign-list'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getWhatsAppUsage } from '@/features/whatsapp/actions'
import { WhatsAppUsageCard } from '@/features/whatsapp/components/usage-card'

export default async function CampaignsPage({ params }: { params: { workspaceSlug: string } }) {
  const { workspaceSlug } = params
  const user = await getCurrentUser()
  const supabase = await createClient()

  if (!user) return null

  const [campaigns, usage] = await Promise.all([getCampaigns(), getWhatsAppUsage()])

  // Fetch customers for the builder
  const { data: customers } = await supabase
    .from('Customer')
    .select('id, name, phone')
    .eq('tenantId', user.tenantId)
    .order('name')

  return (
    <div className="flex-1 space-y-4 p-4 pt-4 sm:p-6 sm:pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Campanhas WhatsApp</h2>
      </div>
      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-5">
          <Tabs defaultValue="new" className="space-y-4">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto p-1 md:w-fit">
              <TabsTrigger value="new" className="min-h-10 shrink-0 px-3 text-sm">
                Nova campanha
              </TabsTrigger>
              <TabsTrigger value="list" className="min-h-10 shrink-0 px-3 text-sm">
                Minhas campanhas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-4">
              <CampaignBuilder
                customers={customers || []}
                maxRecipients={usage?.limits?.maxRecipientsPerCampaign || 100}
                usage={usage}
              />
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <CampaignList campaigns={campaigns} workspaceSlug={workspaceSlug} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="col-span-4 space-y-4 lg:col-span-2">
          <WhatsAppUsageCard summary={usage} workspaceSlug={workspaceSlug} />
        </div>
      </div>
    </div>
  )
}
