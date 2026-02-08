'use client'

import React, { useState } from 'react';
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
    isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface Order {
    id: string;
    customer: { name: string };
    status: string;
    dueDate: Date;
    totalValue: number;
}

interface OrderCalendarProps {
    initialOrders: any[];
}

const statusColors: Record<string, string> = {
    'PENDING': 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
    'PRODUCTION': 'bg-info/10 text-info border-info/20 hover:bg-info/20',
    'READY': 'bg-success/10 text-success border-success/20 hover:bg-success/20',
    'DELIVERED': 'bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted/60',
};

const statusLabels: Record<string, string> = {
    'PENDING': 'Pendente',
    'PRODUCTION': 'Em Produção',
    'READY': 'Pronto',
    'DELIVERED': 'Entregue',
};

const statusDotColors: Record<string, string> = {
    'PENDING': 'bg-warning',
    'PRODUCTION': 'bg-info',
    'READY': 'bg-success',
    'DELIVERED': 'bg-muted-foreground',
}

export function OrderCalendar({ initialOrders }: OrderCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const orders = initialOrders.map(o => ({
        ...o,
        dueDate: new Date(o.dueDate)
    }));

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-border/50 bg-secondary/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                        <CalendarIcon size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold capitalize text-foreground">
                            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                        </h2>
                        <p className="text-xs text-muted-foreground">Acompanhamento de entregas</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full w-8 h-8 hover:bg-background/80">
                        <ChevronLeft size={16} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} className="text-xs h-8 rounded-full px-4 border-primary/20 hover:bg-primary/5 hover:text-primary">
                        Hoje
                    </Button>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full w-8 h-8 hover:bg-background/80">
                        <ChevronRight size={16} />
                    </Button>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 border-b border-border/50 bg-secondary/10">
                {weekDays.map((day) => (
                    <div key={day} className="py-3 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 bg-background/20">
                {calendarDays.map((day, idx) => {
                    const dayOrders = orders.filter(order => isSameDay(order.dueDate, day));
                    const isSelectedMonth = isSameMonth(day, monthStart);

                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "min-h-[120px] p-2 border-r border-b border-border/50 relative transition-all hover:bg-primary/[0.02]",
                                !isSelectedMonth && "bg-secondary/5 text-muted-foreground/30",
                                (idx + 1) % 7 === 0 && "border-r-0"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all",
                                    isToday(day)
                                        ? "bg-primary text-primary-foreground shadow-md scale-110"
                                        : "text-muted-foreground"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                {dayOrders.map((order) => (
                                    <TooltipProvider key={order.id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={cn(
                                                        "text-[10px] px-2 py-1.5 rounded-md border truncate cursor-pointer transition-all hover:scale-[1.02] hover:shadow-sm",
                                                        statusColors[order.status] || 'bg-secondary text-secondary-foreground'
                                                    )}
                                                >
                                                    <span className="font-medium flex items-center gap-1">
                                                        <span className={cn("w-1.5 h-1.5 rounded-full", statusDotColors[order.status] || 'bg-muted-foreground/60')} />
                                                        {order.customer?.name || '---'}
                                                    </span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="p-0 overflow-hidden border-none shadow-lg rounded-xl">
                                                <div className="w-[240px] bg-background p-4 space-y-3">
                                                    <div className="flex justify-between items-start border-b border-border/50 pb-2">
                                                        <span className="font-bold text-sm text-foreground">{order.customer?.name || 'Cliente'}</span>
                                                        <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">{statusLabels[order.status]}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-muted-foreground flex justify-between">
                                                            <span>Valor:</span>
                                                            <span className="font-medium text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalValue)}</span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground flex justify-between">
                                                            <span>Data:</span>
                                                            <span className="font-medium text-foreground">{format(order.dueDate, "dd/MM/yyyy")}</span>
                                                        </p>
                                                    </div>

                                                    <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1 hover:border-primary hover:text-primary">
                                                        Ver detalhes <ChevronRight size={12} />
                                                    </Button>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer / Legend */}
            <div className="p-4 bg-secondary/30 flex flex-wrap gap-6 border-t border-border/50">
                {Object.entries(statusLabels).map(([status, label]) => (
                    <div key={status} className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", statusDotColors[status] || 'bg-muted-foreground/60')} />
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
}
