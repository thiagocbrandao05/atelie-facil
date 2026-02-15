import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Instagram, Facebook, Phone } from 'lucide-react'

type Props = {
  params: Promise<{
    workspaceSlug: string
  }>
}

type TenantRow = {
  id: string
  name: string
  slug: string
}

type SettingsRow = {
  storeName?: string | null
  instagram?: string | null
  facebook?: string | null
  phone?: string | null
}

export default async function PublicCatalogPage({ params }: Props) {
  const { workspaceSlug } = await params
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('Tenant')
    .select('id, name, slug')
    .eq('slug', workspaceSlug)
    .single()

  const tenantData = tenant as TenantRow | null
  if (!tenantData) notFound()

  const { data: settings } = await supabase
    .from('Settings')
    .select('storeName, instagram, facebook, phone')
    .eq('tenantId', tenantData.id)
    .single()
  const settingsData = settings as SettingsRow | null

  const storeName = settingsData?.storeName || tenantData.name || workspaceSlug

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
          Catálogo
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{storeName}</h1>
        <p className="text-muted-foreground mt-3">
          Página pública do ateliê para apresentar sua marca e facilitar pedidos.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {settingsData?.phone && (
            <a
              href={`https://wa.me/${settingsData.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              <Phone className="h-4 w-4" />
              Falar no WhatsApp
            </a>
          )}
          {settingsData?.instagram && (
            <a
              href={`https://instagram.com/${settingsData.instagram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              <Instagram className="h-4 w-4" />
              Instagram
            </a>
          )}
          {settingsData?.facebook && (
            <a
              href={settingsData.facebook}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </a>
          )}
        </div>
      </div>
    </main>
  )
}
