'use client'

import { Button } from '@/components/ui/button'

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="bg-primary text-primary-foreground">
      Imprimir ou Salvar PDF
    </Button>
  )
}
