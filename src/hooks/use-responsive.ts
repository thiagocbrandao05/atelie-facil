/**
 * Responsive design utilities and hooks
 */

'use client'

import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const BREAKPOINTS = {
    mobile: 640,
    tablet: 1024,
    desktop: 1280
}

/**
 * Hook to detect current breakpoint
 */
export function useBreakpoint(): Breakpoint {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth

            if (width < BREAKPOINTS.mobile) {
                setBreakpoint('mobile')
            } else if (width < BREAKPOINTS.tablet) {
                setBreakpoint('tablet')
            } else {
                setBreakpoint('desktop')
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return breakpoint
}

/**
 * Hook to detect if mobile
 */
export function useIsMobile(): boolean {
    const breakpoint = useBreakpoint()
    return breakpoint === 'mobile'
}

/**
 * Hook to detect if tablet
 */
export function useIsTablet(): boolean {
    const breakpoint = useBreakpoint()
    return breakpoint === 'tablet'
}

/**
 * Hook to detect if desktop
 */
export function useIsDesktop(): boolean {
    const breakpoint = useBreakpoint()
    return breakpoint === 'desktop'
}

/**
 * Responsive value selector
 */
export function useResponsiveValue<T>(values: {
    mobile: T
    tablet?: T
    desktop: T
}): T {
    const breakpoint = useBreakpoint()

    switch (breakpoint) {
        case 'mobile':
            return values.mobile
        case 'tablet':
            return values.tablet ?? values.desktop
        case 'desktop':
            return values.desktop
    }
}

/**
 * Detect touch device
 */
export function useIsTouchDevice(): boolean {
    const [isTouch, setIsTouch] = useState(false)

    useEffect(() => {
        setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }, [])

    return isTouch
}

/**
 * Get optimal column count based on screen size
 */
export function useResponsiveColumns(options?: {
    mobile?: number
    tablet?: number
    desktop?: number
}): number {
    return useResponsiveValue({
        mobile: options?.mobile ?? 1,
        tablet: options?.tablet ?? 2,
        desktop: options?.desktop ?? 3
    })
}


