'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { DateRangeFilter } from '@/components/date-range-filter'
import { format } from 'date-fns'

export function ReportsFilterWrapper() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (start: Date, end: Date) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('from', start.toISOString())
    params.set('to', end.toISOString())
    router.push(`?${params.toString()}`)
  }

  return <DateRangeFilter onFilterChange={handleFilterChange} />
}
