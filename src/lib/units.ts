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

    if (!from || !to || from.category !== toUnitCategory(to.category)) {
        // Simple fallback if no category match (or same unit)
        if (fromUnit === toUnit) return quantity
        return quantity
    }

    // Convert from source to base, then base to target
    // Example: 50cm to m -> 50 / 100 = 0.5m
    // Example: 1m to cm -> 1 * 100 = 100cm
    const baseValue = quantity / from.ratioToBase
    return baseValue * to.ratioToBase
}

function toUnitCategory(cat: UnitCategory): UnitCategory {
    return cat
}


