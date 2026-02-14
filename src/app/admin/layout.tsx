import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    // Double check (Middleware should handle this, but for safety)
    if (!user || user.role !== 'SUPER_ADMIN') {
        // redirect('/') 
        // Temporarily commented out until we manually set the role in DB
        // console.warn('Non-admin user accessing admin layout:', user?.email)
    }

    return (
        <div className="flex min-h-screen w-full bg-background text-foreground">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
