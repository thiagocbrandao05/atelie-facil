/**
 * CSV Export utilities
 */

import type { OrderWithDetails, Material, ProductWithMaterials, Customer } from './types'
import { formatCurrency, formatDate, formatDateTime } from './formatters'

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: Record<string, unknown>[], headers: string[]): string {
  const headerRow = headers.join(',')
  const rows = data.map(row =>
    headers
      .map(header => {
        const value = row[header]
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      })
      .join(',')
  )

  return [headerRow, ...rows].join('\n')
}

/**
 * Download CSV file
 */
function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportOrdersToCSV(orders: OrderWithDetails[]): void {
  const data = orders.map(order => ({
    ID: order.id,
    Cliente: order.customer.name,
    Status: order.status,
    'Data Criacao': formatDateTime(order.createdAt),
    'Data Entrega': formatDate(order.dueDate),
    'Valor Total': order.totalValue,
    'Qtd Itens': order.items.length,
  }))

  const csv = arrayToCSV(data, [
    'ID',
    'Cliente',
    'Status',
    'Data Criacao',
    'Data Entrega',
    'Valor Total',
    'Qtd Itens',
  ])

  downloadCSV(csv, `pedidos_${new Date().toISOString().split('T')[0]}.csv`)
}

export function exportProductsToCSV(products: ProductWithMaterials[]): void {
  const data = products.map(product => ({
    ID: product.id,
    Nome: product.name,
    'Tempo Producao (min)': product.laborTime,
    'Margem Lucro (%)': product.profitMargin,
    'Qtd Materiais': product.materials.length,
  }))

  const csv = arrayToCSV(data, [
    'ID',
    'Nome',
    'Tempo Producao (min)',
    'Margem Lucro (%)',
    'Qtd Materiais',
  ])

  downloadCSV(csv, `produtos_${new Date().toISOString().split('T')[0]}.csv`)
}

export function exportMaterialsToCSV(materials: Material[]): void {
  const data = materials.map(material => ({
    ID: material.id,
    Nome: material.name,
    Unidade: material.unit,
    Custo: material.cost || 0,
    Quantidade: material.quantity || 0,
    'Estoque Minimo': material.minQuantity ?? 'N/A',
  }))

  const csv = arrayToCSV(data, ['ID', 'Nome', 'Unidade', 'Custo', 'Quantidade', 'Estoque Minimo'])

  downloadCSV(csv, `materiais_${new Date().toISOString().split('T')[0]}.csv`)
}

export function exportCustomersToCSV(customers: Customer[]): void {
  const data = customers.map(customer => ({
    ID: customer.id,
    Nome: customer.name,
    Telefone: customer.phone ?? 'N/A',
    Email: customer.email ?? 'N/A',
    Endereco: customer.address ?? 'N/A',
  }))

  const csv = arrayToCSV(data, ['ID', 'Nome', 'Telefone', 'Email', 'Endereco'])

  downloadCSV(csv, `clientes_${new Date().toISOString().split('T')[0]}.csv`)
}

export function exportFinancialReportToCSV(
  orders: OrderWithDetails[],
  startDate: Date,
  endDate: Date
): void {
  const data = orders.map(order => {
    const materialCosts = order.items.reduce((sum, item) => {
      const productMaterialCost = item.product.materials.reduce((matSum, pm) => {
        const cost = pm.material.cost || 0
        return matSum + Number(cost) * pm.quantity
      }, 0)
      return sum + productMaterialCost * item.quantity
    }, 0)

    const laborCosts = order.items.reduce((sum, item) => {
      const laborCost = (item.product.laborTime / 60) * 20
      return sum + laborCost * item.quantity
    }, 0)

    const totalCosts = materialCosts + laborCosts
    const profit = order.totalValue - totalCosts
    const margin = order.totalValue > 0 ? (profit / order.totalValue) * 100 : 0

    return {
      Data: formatDate(order.createdAt),
      Pedido: order.id.substring(0, 8),
      Cliente: order.customer.name,
      Receita: formatCurrency(order.totalValue),
      'Custo Material': formatCurrency(materialCosts),
      'Custo Mao de Obra': formatCurrency(laborCosts),
      'Custo Total': formatCurrency(totalCosts),
      Lucro: formatCurrency(profit),
      'Margem (%)': margin.toFixed(2),
    }
  })

  const csv = arrayToCSV(data, [
    'Data',
    'Pedido',
    'Cliente',
    'Receita',
    'Custo Material',
    'Custo Mao de Obra',
    'Custo Total',
    'Lucro',
    'Margem (%)',
  ])

  const filename =
    `relatorio_financeiro_${formatDate(startDate)}_${formatDate(endDate)}.csv`.replace(/\//g, '-')

  downloadCSV(csv, filename)
}
