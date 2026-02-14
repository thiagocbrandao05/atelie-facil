export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 flex min-h-screen w-full flex-col">
      <header className="bg-background/50 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="container mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded text-xs font-bold">
              A
            </div>
            <span className="text-primary text-lg font-bold tracking-tight">Atelis</span>
          </div>
        </div>
      </header>
      <main className="flex w-full flex-1 flex-col items-center">{children}</main>
      <footer className="text-muted-foreground py-8 text-center text-xs">
        &copy; {new Date().getFullYear()} Atelis - Gestão para Artesãos
      </footer>
    </div>
  )
}
