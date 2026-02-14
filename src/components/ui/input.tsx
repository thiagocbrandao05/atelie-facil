import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    const normalizedValue =
      props.value !== props.value || (typeof props.value === 'number' && isNaN(props.value))
        ? ''
        : props.value

    return (
      <input
        type={type}
        className={cn(
          'border-input bg-background/50 backdrop-blur-sm ring-offset-background file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200 focus:bg-background focus:border-primary/50',
          className
        )}
        ref={ref}
        {...props}
        value={normalizedValue}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
