"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function LandingNavbar() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <nav
            className={cn(
                "fixed top-0 w-full z-50 transition-all duration-300 px-4 pt-4",
                scrolled ? "pt-2" : "pt-4"
            )}
        >
            <div
                className={cn(
                    "container mx-auto max-w-7xl h-14 flex items-center justify-between px-6 rounded-2xl transition-all duration-300",
                    scrolled
                        ? "bg-primary/90 text-primary-foreground backdrop-blur-md shadow-lg border border-primary/20"
                        : "bg-transparent"
                )}
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-accent-foreground font-bold shadow-md">
                        A
                    </div>
                    <span className={cn(
                        "font-bold text-lg tracking-tight transition-colors",
                        scrolled ? "text-primary-foreground" : "text-foreground"
                    )}>
                        AteliêFácil
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    {["Funcionalidades", "Planos", "Sobre"].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className={cn(
                                "text-sm font-medium transition-colors hover:opacity-70",
                                scrolled ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}
                        >
                            {item}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/login"
                        className={cn(
                            "px-4 py-2 text-sm font-semibold transition-all hover:opacity-70",
                            scrolled ? "text-primary-foreground" : "text-foreground"
                        )}
                    >
                        Entrar
                    </Link>
                    <Link
                        href="/register"
                        className={cn(
                            "px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 active:scale-95",
                            scrolled
                                ? "bg-background text-foreground hover:bg-muted"
                                : "bg-primary text-primary-foreground hover:bg-primary-hover"
                        )}
                    >
                        Começar Grátis
                    </Link>
                </div>
            </div>
        </nav>
    )
}
