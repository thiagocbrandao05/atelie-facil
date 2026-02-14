'use client'

import React, { useState } from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  eachDayOfInterval,
  isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Order {
  id: string
  customer: { name: string }
  status: string
  dueDate: Date
  totalValue: number
}

interface OrderCalendarProps {
  initialOrders: any[]
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
  PRODUCTION: 'bg-info/10 text-info border-info/20 hover:bg-info/20',
  READY: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
  DELIVERED: 'bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted/60',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PRODUCTION: 'Em Produção',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
}

const statusDotColors: Record<string, string> = {
  PENDING: 'bg-warning',
  PRODUCTION: 'bg-info',
  READY: 'bg-success',
  DELIVERED: 'bg-muted-foreground',
}

export function OrderCalendar({ initialOrders }: OrderCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const orders = initialOrders.map(o => ({
    ...o,
    dueDate: new Date(o.dueDate),
  }))

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="border-border/50 overflow-hidden rounded-2xl border bg-white/50 shadow-sm backdrop-blur-sm">
      {/* Header */}
      <div className="border-border/50 bg-secondary/30 flex items-center justify-between border-b p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-sm">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-foreground text-lg font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <p className="text-muted-foreground text-xs">Acompanhamento de entregas</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevMonth}
            className="hover:bg-background/80 h-8 w-8 rounded-full"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
            className="border-primary/20 hover:bg-primary/5 hover:text-primary h-8 rounded-full px-4 text-xs"
          >
            Hoje
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            className="hover:bg-background/80 h-8 w-8 rounded-full"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Grid Header */}
      <div className="border-border/50 bg-secondary/10 grid grid-cols-7 border-b">
        {weekDays.map(day => (
          <div
            key={day}
            className="text-muted-foreground py-3 text-center text-[10px] font-bold tracking-wider uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="bg-background/20 grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const dayOrders = orders.filter(order => isSameDay(order.dueDate, day))
          const isSelectedMonth = isSameMonth(day, monthStart)

          return (
            <div
              key={day.toString()}
              className={cn(
                'border-border/50 hover:bg-primary/[0.02] relative min-h-[120px] border-r border-b p-2 transition-all',
                !isSelectedMonth && 'bg-secondary/5 text-muted-foreground/30',
                (idx + 1) % 7 === 0 && 'border-r-0'
              )}
            >
              <div className="mb-2 flex items-start justify-between">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-all',
                    isToday(day)
                      ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                      : 'text-muted-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="space-y-1.5">
                {dayOrders.map(order => (
                  <TooltipProvider key={order.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'cursor-pointer truncate rounded-md border px-2 py-1.5 text-[10px] transition-all hover:scale-[1.02] hover:shadow-sm',
                            statusColors[order.status] || 'bg-secondary text-secondary-foreground'
                          )}
                        >
                          <span className="flex items-center gap-1 font-medium">
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                statusDotColors[order.status] || 'bg-muted-foreground/60'
                              )}
                            />
                            {order.customer?.name || '---'}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="overflow-hidden rounded-xl border-none p-0 shadow-lg"
                      >
                        <div className="bg-background w-[240px] space-y-3 p-4">
                          <div className="border-border/50 flex items-start justify-between border-b pb-2">
                            <span className="text-foreground text-sm font-bold">
                              {order.customer?.name || 'Cliente'}
                            </span>
                            <span className="bg-secondary rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                              {statusLabels[order.status]}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground flex justify-between text-xs">
                              <span>Valor:</span>
                              <span className="text-foreground font-medium">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(order.totalValue)}
                              </span>
                            </p>
                            <p className="text-muted-foreground flex justify-between text-xs">
                              <span>Data:</span>
                              <span className="text-foreground font-medium">
                                {format(order.dueDate, 'dd/MM/yyyy')}
                              </span>
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:border-primary hover:text-primary h-8 w-full gap-1 text-xs"
                          >
                            Ver detalhes <ChevronRight size={12} />
                          </Button>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer / Legend */}
      <div className="bg-secondary/30 border-border/50 flex flex-wrap gap-6 border-t p-4">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div
            key={status}
            className="text-muted-foreground flex items-center gap-2 text-xs font-medium"
          >
            <div
              className={cn(
                'h-2.5 w-2.5 rounded-full shadow-sm',
                statusDotColors[status] || 'bg-muted-foreground/60'
              )}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
