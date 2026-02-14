'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedSectionProps {
    children: ReactNode
    className?: string
    delay?: number
    direction?: 'up' | 'down' | 'left' | 'right' | 'none'
    viewportAmount?: number
}

export function AnimatedSection({
    children,
    className,
    delay = 0,
    direction = 'up',
    viewportAmount = 0.2,
}: AnimatedSectionProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: viewportAmount })

    const getVariants = () => {
        const hidden: any = { opacity: 0 }
        const visible: any = { opacity: 1 }

        switch (direction) {
            case 'up':
                hidden.y = 40
                visible.y = 0
                break
            case 'down':
                hidden.y = -40
                visible.y = 0
                break
            case 'left':
                hidden.x = 40
                visible.x = 0
                break
            case 'right':
                hidden.x = -40
                visible.x = 0
                break
            case 'none':
                hidden.scale = 0.95
                visible.scale = 1
                break
        }

        return { hidden, visible }
    }

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={getVariants()}
            transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98], delay }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    )
}
