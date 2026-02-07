export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/30 w-full flex flex-col">
            <header className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container max-w-3xl mx-auto py-4 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                            A
                        </div>
                        <span className="font-bold text-lg text-primary tracking-tight">AteliêFácil</span>
                    </div>
                </div>
            </header>
            <main className="flex-1 w-full flex flex-col items-center">
                {children}
            </main>
            <footer className="py-8 text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} AteliêFácil - Gestão para Artesãos
            </footer>
        </div>
    );
}


