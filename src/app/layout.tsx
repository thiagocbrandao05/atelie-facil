import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Atelis | Gestão Inteligente para Artesãos',
    template: '%s | Atelis',
  },
  description:
    'O sistema definitivo para gerenciar seu ateliê. Controle pedidos, estoque e custos em um só lugar.',
  keywords: ['ateliê', 'artisan', 'gestão', 'crafts', 'estoque', 'financeiro'],
  authors: [{ name: 'Thiago Marins' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://atelis.com.br',
    title: 'Atelis | Gestão Inteligente',
    description: 'Simplifique a gestão do seu ateliê agora mesmo.',
    siteName: 'Atelis',
  },
  icons: {
    icon: '/favicon.ico',
  },
}

import { ThemeProvider } from '@/components/theme-provider'
import { NotificationProvider } from '@/components/notification-provider'
import { ThemeColorManager } from '@/components/theme-color-manager'
import { getSettings } from '@/features/settings/actions'
import { resolveThemeKey } from '@/lib/theme-tokens'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSettings()

  return (
    // suppressHydrationWarning is required by next-themes
    <html lang="pt-BR" data-theme={resolveThemeKey(settings.primaryColor)} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} ${outfit.variable} text-foreground min-h-screen font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ThemeColorManager color={settings.primaryColor} />
          <NotificationProvider>
            <div className="bg-background min-h-screen">{children}</div>
            <Toaster richColors position="top-right" />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
