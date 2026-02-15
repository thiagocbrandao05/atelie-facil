'use client'

import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface UpgradeLockProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function UpgradeLock({
  message = 'Disponível nos planos pagos',
  className = '',
  size = 'md',
}: UpgradeLockProps) {
  return (
    <div
      className={`border-primary/20 bg-muted/30 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center ${className}`}
    >
      <div
        className={`bg-primary/10 text-primary flex items-center justify-center rounded-full ${size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12'}`}
      >
        <Lock size={size === 'sm' ? 14 : size === 'lg' ? 24 : 18} />
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          Recurso Premium
        </p>
        <p className="text-muted-foreground/80 max-w-[200px] text-[10px]">{message}</p>
      </div>
    </div>
  )
}
