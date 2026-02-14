import { getSettings } from '@/features/settings/actions'
import dynamic from 'next/dynamic'

const SettingsForm = dynamic(
  () => import('@/components/settings-form').then(mod => mod.SettingsForm),
  {
    loading: () => <div className="p-8 text-center">Carregando formulário...</div>,
  }
)

export default async function SettingsPage({ params }: { params: { workspaceSlug: string } }) {
  const { workspaceSlug } = params
  const settings = await getSettings()
  const { getWhatsAppUsage } = await import('@/features/whatsapp/actions')
  const whatsappUsage = await getWhatsAppUsage()

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground mt-1">
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
