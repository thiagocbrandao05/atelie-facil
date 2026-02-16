import { describe, it, expect } from 'vitest'
import { convertQuantity, getAvailableUnits } from '@/lib/units'

describe('Units Utilities', () => {
  it('should handle unknown unit conversion by returning same quantity', () => {
    expect(convertQuantity(10, 'kg', 'm')).toBe(10)
  })

  it('should handle missing units', () => {
    expect(convertQuantity(10, undefined as unknown as string, 'm')).toBe(10)
  })

  it('should return available units', () => {
    const units = getAvailableUnits()
    expect(units).toContain('m')
    expect(units).toContain('cm')
  })
})
