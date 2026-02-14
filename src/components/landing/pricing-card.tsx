'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface PricingCardProps {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  highlight?: boolean
  isAnnual?: boolean
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  highlight = false,
  isAnnual = false,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-[2.5rem] p-8 transition-all duration-500 hover:scale-[1.02]',
        highlight
          ? 'bg-primary text-primary-foreground shadow-primary/20 z-10 shadow-2xl'
          : 'bg-card border-border/60 text-foreground border shadow-xl shadow-black/5'
      )}
    >
      {highlight && (
        <div className="bg-accent text-accent-foreground absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-black tracking-widest uppercase shadow-lg">
          Recomendado
        </div>
      )}

      <div className="mb-8">
        <h3
          className={cn(
            'mb-2 text-xl font-black tracking-tight uppercase',
            highlight ? 'text-primary-foreground' : 'text-foreground'
          )}
        >
          {name}
        </h3>
        <p
          className={cn(
            'text-sm font-medium opacity-70',
            highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}
        >
          {description}
          <Link
            href={`/planos/${name.toLowerCase()}`}
            className={cn(
              'mt-2 block text-xs font-bold hover:underline',
              highlight ? 'text-primary-foreground' : 'text-primary'
            )}
          >
            Saiba mais sobre este plano →
          </Link>
        </p>
      </div>

      <div className="mb-8 flex items-baseline gap-1">
        <span className="text-5xl font-black tracking-tighter">{price}</span>
        <span className="text-lg font-bold opacity-60">/{period}</span>
      </div>

      <ul className="mb-10 flex-1 space-y-4">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm font-medium">
            <div
              className={cn(
                'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full',
                highlight ? 'bg-white/20' : 'bg-primary/10'
              )}
            >
              <Check className={cn('h-3 w-3', highlight ? 'text-white' : 'text-primary')} />
            </div>
            <span className={highlight ? 'text-primary-foreground/90' : 'text-foreground/90'}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={`/register?plan=${name.toLowerCase()}&billing=${isAnnual ? 'annual' : 'monthly'}`}
        className={cn(
          'w-full rounded-2xl py-4 text-center font-black transition-all active:scale-[0.98]',
          highlight
            ? 'bg-background text-foreground hover:bg-muted shadow-lg shadow-black/10'
            : 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-primary/10 shadow-lg'
        )}
      >
        {cta}
      </Link>
    </div>
  )
}
