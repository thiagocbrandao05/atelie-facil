import Decimal from 'decimal.js'

/**
 * Configure Decimal for financial precision
 * 20 significant digits and rounding to half up (banker's rounding)
 */
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

/**
 * Apportions freight proportionally by item value.
 */
export function calculateApportionedFreight(
    itemValue: number | string | Decimal,
    totalItemsValue: number | string | Decimal,
    totalFreight: number | string | Decimal
): Decimal {
    const item = new Decimal(itemValue)
    const totalItems = new Decimal(totalItemsValue)
    const freight = new Decimal(totalFreight)

    if (totalItems.isZero()) return new Decimal(0)

    // proporcao = item / total
    const proportion = item.dividedBy(totalItems)
    // frete_item = frete_total * proporcao
    return freight.times(proportion)
}

/**
 * Calculates the unit cost for a purchase item including its apportioned freight.
 */
export function calculateItemPurchaseCost(
    itemValue: number | string | Decimal,
    quantity: number | string | Decimal,
    apportionedFreight: number | string | Decimal
): Decimal {
    const value = new Decimal(itemValue)
    const qty = new Decimal(quantity)
    const freight = new Decimal(apportionedFreight)

    if (qty.isZero()) return new Decimal(0)

    // (valor_item + frete_item) / quantidade
    return value.plus(freight).dividedBy(qty)
}

/**
 * Calculates the Moving Average Cost (MPM).
 * novo_custo = ((Q_atual * C_atual) + (Q_nova * C_novo)) / (Q_atual + Q_nova)
 */
export function calculateMovingAverageCost(
    currentQuantity: number | string | Decimal,
    currentAverageCost: number | string | Decimal,
    newQuantity: number | string | Decimal,
    newPurchaseCost: number | string | Decimal
): Decimal {
    const qCurrent = new Decimal(currentQuantity)
    const cCurrent = new Decimal(currentAverageCost)
    const qNew = new Decimal(newQuantity)
    const cNew = new Decimal(newPurchaseCost)

    const totalQuantity = qCurrent.plus(qNew)

    if (totalQuantity.isZero()) return new Decimal(0)
    if (qCurrent.isZero()) return cNew // If starting from zero, the cost is the new purchase cost

    const currentTotalValue = qCurrent.times(cCurrent)
    const newTotalValue = qNew.times(cNew)

    return currentTotalValue.plus(newTotalValue).dividedBy(totalQuantity)
}

/**
 * Calculates the hourly rate for labor.
 */
export function calculateHourlyRate(
    monthlySalary: number | string | Decimal,
    workingHoursPerMonth: number | string | Decimal
): Decimal {
    const salary = new Decimal(monthlySalary)
    const hours = new Decimal(workingHoursPerMonth)

    if (hours.isZero()) return new Decimal(0)

    return salary.dividedBy(hours)
}

/**
 * Calculates fixed cost absorption rate per hour.
 */
export function calculateFixedCostRate(
    totalMonthlyFixedCosts: number | string | Decimal,
    workingHoursPerMonth: number | string | Decimal
): Decimal {
    const fixed = new Decimal(totalMonthlyFixedCosts)
    const hours = new Decimal(workingHoursPerMonth)

    if (hours.isZero()) return new Decimal(0)

    return fixed.dividedBy(hours)
}

/**
 * Calculates the suggested price using the cost-plus method.
 * preco = custo / (1 - margem_decimal)
 */
export function calculateSuggestedPrice(
    totalCost: number | string | Decimal,
    profitMarginPercent: number | string | Decimal
): Decimal {
    const cost = new Decimal(totalCost)
    const margin = new Decimal(profitMarginPercent).dividedBy(100)

    if (margin.greaterThanOrEqualTo(1)) {
        // Avoid division by zero or negative price if margin is 100% or more
        // Contabilmente, margem de 100% no denominador é impossível.
        // Usamos o custo + margem como fallback caso o usuário use margem > 100% em cenários não ideais
        return cost.times(new Decimal(1).plus(margin))
    }

    // preco = custo / (1 - margin)
    return cost.dividedBy(new Decimal(1).minus(margin))
}

/**
 * Formats a decimal to 4 decimal places for internal calculations.
 */
export function formatInternal(value: Decimal): number {
    return value.toDecimalPlaces(4).toNumber()
}

/**
 * Formats a decimal to 2 decimal places for display.
 */
export function formatDisplay(value: Decimal): number {
    return value.toDecimalPlaces(2).toNumber()
}
