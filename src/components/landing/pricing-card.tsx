"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
    isAnnual = false
}: PricingCardProps) {
    return (
        <div
            className={cn(
                "relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-500 hover:scale-[1.02]",
                highlight
                    ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/20 z-10"
                    : "bg-card border border-border/60 text-foreground shadow-xl shadow-black/5"
            )}
        >
            {highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-accent-foreground text-xs font-black uppercase tracking-widest shadow-lg">
                    Recomendado
                </div>
            )}

            <div className="mb-8">
                <h3 className={cn(
                    "text-xl font-black mb-2 uppercase tracking-tight",
                    highlight ? "text-primary-foreground" : "text-foreground"
                )}>
                    {name}
                </h3>
                <p className={cn(
                    "text-sm font-medium opacity-70",
                    highlight ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                    {description}
                </p>
            </div>

            <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black tracking-tighter">{price}</span>
                <span className="text-lg font-bold opacity-60">/{period}</span>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                        <div className={cn(
                            "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                            highlight ? "bg-white/20" : "bg-primary/10"
                        )}>
                            <Check className={cn("w-3 h-3", highlight ? "text-white" : "text-primary")} />
                        </div>
                        <span className={highlight ? "text-primary-foreground/90" : "text-foreground/90"}>
                            {feature}
                        </span>
                    </li>
                ))}
            </ul>

            <Link
                href={`/register?plan=${name.toLowerCase()}&billing=${isAnnual ? "annual" : "monthly"}`}
                className={cn(
                    "w-full py-4 rounded-2xl text-center font-black transition-all active:scale-[0.98]",
                    highlight
                        ? "bg-background text-foreground hover:bg-muted shadow-lg shadow-black/10"
                        : "bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg shadow-primary/10"
                )}
            >
                {cta}
            </Link>
        </div>
    )
}
