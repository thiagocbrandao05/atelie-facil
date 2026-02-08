import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: "AteliêFácil | Gestão Inteligente para Artesãos",
    template: "%s | AteliêFácil"
  },
  description: "O sistema definitivo para gerenciar seu ateliê. Controle pedidos, estoque e custos em um só lugar.",
  keywords: ["ateliê", "artisan", "gestão", "crafts", "estoque", "financeiro"],
  authors: [{ name: "Thiago Marins" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://ateliefacil.com.br",
    title: "AteliêFácil | Gestão Inteligente",
    description: "Simplifique a gestão do seu ateliê agora mesmo.",
    siteName: "AteliêFácil",
  },
  icons: {
    icon: "/favicon.ico",
  }
};

import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/components/notification-provider";
import { ThemeColorManager } from "@/components/theme-color-manager";
import { getSettings } from "@/features/settings/actions";
import { resolveThemeKey } from "@/lib/theme-tokens";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html
      lang="pt-BR"
      data-theme={resolveThemeKey(settings.primaryColor)}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased min-h-screen text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ThemeColorManager color={settings.primaryColor} />
          <NotificationProvider>
            <div className="min-h-screen bg-background">
              {children}
            </div>
            <Toaster richColors position="top-right" />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
