import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen w-full">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl p-8">{children}</div>
      </main>
    </div>
  )
}
