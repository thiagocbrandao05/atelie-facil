'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getDateRangePreset } from '@/lib/analytics'

interface DateRangeFilterProps {
    onFilterChange: (startDate: Date, endDate: Date) => void
}

export function DateRangeFilter({ onFilterChange }: DateRangeFilterProps) {
    const [startDate, setStartDate] = useState<Date>()
    const [endDate, setEndDate] = useState<Date>()
    const [preset, setPreset] = useState<string>('month')

    const handlePresetChange = (value: string) => {
        setPreset(value)
        const range = getDateRangePreset(value as any)
        setStartDate(range.start)
        setEndDate(range.end)
        onFilterChange(range.start, range.end)
    }

    const handleCustomDateChange = () => {
        if (startDate && endDate) {
            onFilterChange(startDate, endDate)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Filtros de Período</CardTitle>
                <CardDescription>Selecione o período para análise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Preset Filters */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Período Rápido</label>
                    <Select value={preset} onValueChange={handlePresetChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Hoje</SelectItem>
                            <SelectItem value="week">Última Semana</SelectItem>
                            <SelectItem value="month">Último Mês</SelectItem>
                            <SelectItem value="quarter">Último Trimestre</SelectItem>
                            <SelectItem value="year">Último Ano</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Custom Date Range */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Período Personalizado</label>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "flex-1 justify-start text-left font-normal",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "flex-1 justify-start text-left font-normal",
                                        !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button
                        onClick={handleCustomDateChange}
                        disabled={!startDate || !endDate}
                        className="w-full"
                    >
                        Aplicar Filtro
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}


