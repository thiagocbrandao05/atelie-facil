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
                        ? "bg-[#455448]/90 backdrop-blur-md shadow-lg border border-white/10"
                        : "bg-transparent"
                )}
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#9C4A2F] flex items-center justify-center text-white font-bold shadow-md">
                        A
                    </div>
                    <span className={cn(
                        "font-bold text-lg tracking-tight transition-colors",
                        scrolled ? "text-white" : "text-[#455448]"
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
                                scrolled ? "text-white/80" : "text-[#455448]/80"
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
                            scrolled ? "text-white" : "text-[#455448]"
                        )}
                    >
                        Entrar
                    </Link>
                    <Link
                        href="/register"
                        className={cn(
                            "px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 active:scale-95",
                            scrolled
                                ? "bg-white text-[#455448] hover:bg-[#F5F4F0]"
                                : "bg-[#455448] text-white hover:bg-[#455448]/90"
                        )}
                    >
                        Começar Grátis
                    </Link>
                </div>
            </div>
        </nav>
    )
}
