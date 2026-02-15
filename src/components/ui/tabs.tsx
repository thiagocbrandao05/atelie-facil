'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type TabsContextValue = {
  value: string
  onValueChange: (value: string) => void
  baseId: string
  keepMounted: boolean
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    defaultValue: string
    value?: string
    onValueChange?: (value: string) => void
    keepMounted?: boolean
  }
>(({ className, defaultValue, value, onValueChange, keepMounted = true, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const baseId = React.useId()

  const finalValue = value !== undefined ? value : internalValue
  const finalOnChange = onValueChange || setInternalValue

  return (
    <TabsContext.Provider
      value={{ value: finalValue, onValueChange: finalOnChange, baseId, keepMounted }}
    >
      <div ref={ref} className={cn(className)} {...props} />
    </TabsContext.Provider>
  )
})
Tabs.displayName = 'Tabs'

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1',
        className
      )}
      {...props}
    />
  )
)
TabsList.displayName = 'TabsList'

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, onClick, onKeyDown, ...props }, ref) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const isActive = context.value === value
  const triggerId = `${context.baseId}-trigger-${value}`
  const panelId = `${context.baseId}-panel-${value}`

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={triggerId}
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        'ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:bg-background/50 hover:text-foreground',
        className
      )}
      onClick={e => {
        context.onValueChange(value)
        onClick?.(e)
      }}
      onKeyDown={e => {
        const list = e.currentTarget.closest('[role="tablist"]')
        if (!list) {
          onKeyDown?.(e)
          return
        }

        const tabs = Array.from(
          list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
        )
        const currentIndex = tabs.indexOf(e.currentTarget)
        if (currentIndex === -1) {
          onKeyDown?.(e)
          return
        }

        let nextIndex = currentIndex
        if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
        if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
        if (e.key === 'Home') nextIndex = 0
        if (e.key === 'End') nextIndex = tabs.length - 1

        if (nextIndex !== currentIndex) {
          e.preventDefault()
          const nextTab = tabs[nextIndex]
          nextTab.focus()
          nextTab.click()
          return
        }

        onKeyDown?.(e)
      }}
      {...props}
    />
  )
})
TabsTrigger.displayName = 'TabsTrigger'

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string; forceMount?: boolean }
>(({ className, value, forceMount = false, ...props }, ref) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  const isActive = context.value === value
  const shouldRender = forceMount || context.keepMounted || isActive
  const triggerId = `${context.baseId}-trigger-${value}`
  const panelId = `${context.baseId}-panel-${value}`

  if (!shouldRender) return null

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={panelId}
      aria-labelledby={triggerId}
      aria-hidden={!isActive}
      className={cn(
        'ring-offset-background focus-visible:ring-ring animate-in fade-in zoom-in-95 mt-2 duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        !isActive && 'hidden',
        className
      )}
      {...props}
    />
  )
})
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
