'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SearchFilters } from '@/lib/search'

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  showStatusFilter?: boolean
  showDateFilter?: boolean
  showValueFilter?: boolean
}

export function AdvancedSearch({
  onSearch,
  showStatusFilter = false,
  showDateFilter = false,
  showValueFilter = false,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string>()
  const [minValue, setMinValue] = useState<number>()
  const [maxValue, setMaxValue] = useState<number>()
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const handleSearch = () => {
    const filters: SearchFilters = {
      query: query || undefined,
      status,
      minValue,
      maxValue,
    }

    // Track active filters
    const active: string[] = []
    if (query) active.push('Busca')
    if (status) active.push('Status')
    if (minValue !== undefined || maxValue !== undefined) active.push('Valor')
    setActiveFilters(active)

    onSearch(filters)
  }

  const clearFilters = () => {
    setQuery('')
    setStatus(undefined)
    setMinValue(undefined)
    setMaxValue(undefined)
    setActiveFilters([])
    onSearch({})
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nome, ID, produto..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Buscar</Button>
        {activeFilters.length > 0 && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap gap-2">
        {showStatusFilter && (
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="QUOTATION">Orçamento</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="PRODUCING">Produzindo</SelectItem>
              <SelectItem value="READY">Pronto</SelectItem>
              <SelectItem value="DELIVERED">Entregue</SelectItem>
            </SelectContent>
          </Select>
        )}

        {showValueFilter && (
          <>
            <Input
              type="number"
              placeholder="Valor mínimo"
              value={minValue || ''}
              onChange={e => setMinValue(e.target.value ? Number(e.target.value) : undefined)}
              className="w-[140px]"
            />
            <Input
              type="number"
              placeholder="Valor máximo"
              value={maxValue || ''}
              onChange={e => setMaxValue(e.target.value ? Number(e.target.value) : undefined)}
              className="w-[140px]"
            />
          </>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Filtros ativos:</span>
          {activeFilters.map(filter => (
            <Badge key={filter} variant="secondary">
              {filter}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
