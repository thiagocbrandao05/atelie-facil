'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthPickerProps {
  month: number
  year: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function MonthPicker({ month, year, onMonthChange, onYearChange }: MonthPickerProps) {
  const handlePrevious = () => {
    if (month === 1) {
      onMonthChange(12)
      onYearChange(year - 1)
    } else {
      onMonthChange(month - 1)
    }
  }

  const handleNext = () => {
    if (month === 12) {
      onMonthChange(1)
      onYearChange(year + 1)
    } else {
      onMonthChange(month + 1)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handlePrevious}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Select value={month.toString()} onValueChange={val => onMonthChange(Number(val))}>
        <SelectTrigger className="w-[140px]">
          <SelectValue>{MONTH_NAMES[month - 1]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MONTH_NAMES.map((name, index) => (
            <SelectItem key={index} value={(index + 1).toString()}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={year.toString()} onValueChange={val => onYearChange(Number(val))}>
        <SelectTrigger className="w-[100px]">
          <SelectValue>{year}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {[year - 1, year, year + 1].map(y => (
            <SelectItem key={y} value={y.toString()}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" onClick={handleNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
