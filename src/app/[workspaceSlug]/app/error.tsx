'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <div className="bg-danger/10 flex h-20 w-20 items-center justify-center rounded-full">
        <AlertCircle className="text-danger h-10 w-10" />
      </div>
      <h2 className="text-xl font-bold">Algo deu errado!</h2>
      <p className="text-muted-foreground max-w-md text-center">
        Não conseguimos carregar os dados desta página. Tente recarregar ou contate o suporte se o
        erro persistir.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="outline">
          Tentar novamente
        </Button>
        <Button onClick={() => window.location.reload()}>Recarregar página</Button>
      </div>
    </div>
  )
}
