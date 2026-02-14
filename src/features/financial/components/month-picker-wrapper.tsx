'use client'

import { useRouter, useParams } from 'next/navigation'
import { MonthPicker } from './month-picker'

export function MonthPickerWrapper({ month, year }: { month: number; year: number }) {
  const router = useRouter()
  const params = useParams()
  const slug = params.workspaceSlug as string

  const handleMonthChange = (newMonth: number) => {
    router.push(`/${slug}/app/financeiro?month=${newMonth}&year=${year}`)
  }

  const handleYearChange = (newYear: number) => {
    router.push(`/${slug}/app/financeiro?month=${month}&year=${newYear}`)
  }

  return (
    <MonthPicker
      month={month}
      year={year}
      onMonthChange={handleMonthChange}
      onYearChange={handleYearChange}
    />
  )
}
