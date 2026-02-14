export type UnitCategory = 'LENGTH' | 'WEIGHT' | 'QUANTITY'

export interface Unit {
  value: string
  label: string
  category: UnitCategory
  ratioToBase: number // How many of this unit make 1 base unit? (e.g., 100cm = 1m -> ratio 100)
}

export const UNITS: Unit[] = [
  // Length (Base: m)
  { value: 'm', label: 'Metros (m)', category: 'LENGTH', ratioToBase: 1 },
  { value: 'cm', label: 'Centímetros (cm)', category: 'LENGTH', ratioToBase: 100 },
  { value: 'mm', label: 'Milímetros (mm)', category: 'LENGTH', ratioToBase: 1000 },

  // Weight (Base: kg)
  { value: 'kg', label: 'Quilos (kg)', category: 'WEIGHT', ratioToBase: 1 },
  { value: 'g', label: 'Gramas (g)', category: 'WEIGHT', ratioToBase: 1000 },

  // Quantity (Base: un)
  { value: 'un', label: 'Unidades (un)', category: 'QUANTITY', ratioToBase: 1 },
  { value: 'pct', label: 'Pacote (pct)', category: 'QUANTITY', ratioToBase: 1 },
  { value: 'cj', label: 'Conjunto (cj)', category: 'QUANTITY', ratioToBase: 1 },
]

/**
 * Converts a quantity from one unit to another within the same category.
 * If categories differ, returns original value (safety).
 */
export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number {
  const from = UNITS.find(u => u.value === fromUnit)
  const to = UNITS.find(u => u.value === toUnit)

  if (!from || !to || from.category !== to.category) {
    if (fromUnit === toUnit) return quantity
    return quantity
  }

  const baseValue = quantity / from.ratioToBase
  return baseValue * to.ratioToBase
}

export function getAvailableUnits(): string[] {
  return UNITS.map(u => u.value)
}
