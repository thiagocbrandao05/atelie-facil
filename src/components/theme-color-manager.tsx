'use client'

import { useEffect } from 'react'

const COLORS = {
    indigo: {
        primary: '243 75% 59%',       // #4f46e5
        ring: '243 75% 59%',
    },
    rose: {
        primary: '343 87% 55%',       // #f43f5e
        ring: '343 87% 55%',
    },
    emerald: {
        primary: '158 64% 52%',       // #10b981
        ring: '158 64% 52%',
    },
    slate: {
        primary: '215 16% 47%',       // #64748b
        ring: '215 16% 47%',
    }
}

export function ThemeColorManager({ color }: { color?: string }) {
    useEffect(() => {
        const root = document.documentElement
        const themeColor = color as keyof typeof COLORS || 'indigo'
        const values = COLORS[themeColor]

        if (values) {
            root.style.setProperty('--primary', values.primary)
            root.style.setProperty('--ring', values.ring)
        }
    }, [color])

    return null
}


