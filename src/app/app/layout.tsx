import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { getCurrentUser } from '@/lib/auth'
import { getLowStockMaterials } from '@/features/analytics/actions'
import { StockAlertBanner } from '@/components/ui/stock-alert-banner'
import { CommandPalette } from '@/components/command-palette'
import { AppBreadcrumb } from '@/components/dashboard/app-breadcrumb'
import { AppMobileNav } from '@/components/dashboard/mobile-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const lowStockMaterials = await getLowStockMaterials()

  return (
    <div className="text-foreground bg-background relative flex min-h-screen w-full overflow-x-hidden">
      {/* Sidebar */}
      <DashboardSidebar user={user} />

      {/* Main Content Area */}
      <div className="flex w-full flex-1 flex-col transition-all duration-500 md:pl-24">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="bg-background/80 sticky top-0 z-10 flex items-center justify-between border-b p-4 backdrop-blur-md md:hidden">
          <div className="text-primary text-xl font-black tracking-tighter">Atelis</div>
          <AppMobileNav user={user} />
        </header>

        <StockAlertBanner lowStockItems={lowStockMaterials} />

        <main className="flex-1">
          <div className="container mx-auto px-6 py-6 md:px-8 lg:px-10">
            <AppBreadcrumb />
            {children}
          </div>
        </main>
      </div>
      <CommandPalette user={user} />
    </div>
  )
}
