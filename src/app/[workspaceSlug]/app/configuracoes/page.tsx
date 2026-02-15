import { getSettings } from '@/features/settings/actions'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const SettingsForm = dynamic(
  () => import('@/components/settings-form').then(mod => mod.SettingsForm),
  {
    loading: () => (
      <div className="space-y-4 rounded-xl border p-4 md:p-6">
        <p className="text-muted-foreground text-sm" role="status" aria-live="polite">
          Carregando configurações...
        </p>
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    ),
  }
)

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const settings = await getSettings()
  const { getWhatsAppUsage } = await import('@/features/whatsapp/actions')
  const whatsappUsage = await getWhatsAppUsage()

  return (
    <div className="animate-in fade-in space-y-5 duration-500 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Personalize sua loja e preferências do sistema.
          </p>
        </div>
      </div>

      <SettingsForm
        settings={settings}
        whatsappUsage={whatsappUsage}
        workspaceSlug={workspaceSlug}
      />
    </div>
  )
}
