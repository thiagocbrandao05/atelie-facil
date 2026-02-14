'use client'

import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface UpgradeLockProps {
    message?: string
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

export function UpgradeLock({ message = "Disponível nos planos pagos", className = "", size = 'md' }: UpgradeLockProps) {
    return (
        <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/20 bg-muted/30 p-4 text-center ${className}`}>
            <div className={`flex items-center justify-center rounded-full bg-primary/10 text-primary ${size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12'}`}>
                <Lock size={size === 'sm' ? 14 : size === 'lg' ? 24 : 18} />
            </div>
            <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Recurso Premium
                </p>
                <p className="max-w-[200px] text-[10px] text-muted-foreground/80">
                    {message}
                </p>
            </div>
        </div>
    )
}
