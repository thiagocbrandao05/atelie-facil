import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getLowStockMaterials } from "@/features/analytics/actions";
import { StockAlertBanner } from "@/components/ui/stock-alert-banner";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
    const lowStockMaterials = await getLowStockMaterials();

    return (
        <div className="flex text-foreground w-full min-h-screen bg-background">
            {/* Sidebar */}
            <DashboardSidebar user={user} />

            {/* Mobile Header (Hidden on Desktop) */}
            <div className="flex flex-col flex-1 w-full relative">
                <header className="md:hidden border-b p-4 flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-md">
                    <div className="font-bold text-lg text-primary">AteliêFácil</div>
                    <button className="p-2 rounded-md hover:bg-secondary">
                        <Menu size={24} />
                    </button>
                </header>

                <StockAlertBanner lowStockItems={lowStockMaterials} />

                <main className="flex-1 overflow-y-auto bg-background/50">
                    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}


