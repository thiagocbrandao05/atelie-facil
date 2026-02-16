/**
 * Unit tests for search utilities
 */

import { describe, it, expect } from 'vitest'
import {
  searchOrders,
  searchProducts,
  searchMaterials,
  searchCustomers,
  highlightMatch,
  getSearchSuggestions,
} from '@/lib/search'
import { calculateLaborCost, HOURLY_RATE } from '@/lib/logic'

type SearchOrder = Parameters<typeof searchOrders>[0][number]
type SearchProduct = Parameters<typeof searchProducts>[0][number]
type SearchMaterial = Parameters<typeof searchMaterials>[0][number]
type SearchCustomer = Parameters<typeof searchCustomers>[0][number]

describe('Search Utilities', () => {
  const mockOrders = [
    {
      id: '1',
      tenantId: 't1',
      orderNumber: 1,
      customerId: 'c1',
      status: 'PENDING',
      dueDate: new Date('2026-02-01'),
      totalValue: 100,
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date('2026-01-20'),
      publicId: 'pub1',
      customer: {
        id: 'c1',
        tenantId: 't1',
        name: 'João Silva',
        priority: 'NORMAL',
        status: 'ACTIVE',
        phone: null,
        email: null,
        address: null,
        notes: null,
        birthday: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      items: [
        {
          id: 'oi1',
          orderId: '1',
          productId: 'p1',
          quantity: 1,
          price: 100,
          product: {
            id: 'p1',
            tenantId: 't1',
            name: 'Camisa Polo', // Matches 'Polo' better than 'Polo Shirt'
            imageUrl: null,
            laborTime: 60,
            profitMargin: 50,
            materials: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          } as unknown as SearchOrder['items'][number]['product'],
        },
      ],
    },
    {
      id: '2',
      tenantId: 't1',
      orderNumber: 2,
      customerId: 'c2',
      status: 'DELIVERED',
      dueDate: new Date('2026-01-25'),
      totalValue: 200,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      publicId: 'pub2',
      customer: {
        id: 'c2',
        tenantId: 't1',
        name: 'Maria Santos',
        priority: 'NORMAL',
        status: 'ACTIVE',
        phone: null,
        email: null,
        address: null,
        notes: null,
        birthday: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      items: [
        {
          id: 'oi2',
          orderId: '2',
          productId: 'p2',
          quantity: 1,
          price: 200,
          product: {
            id: 'p2',
            tenantId: 't1',
            name: 'Vestido',
            imageUrl: null,
            laborTime: 120,
            profitMargin: 60,
            materials: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          } as unknown as SearchOrder['items'][number]['product'],
        },
      ],
    },
    {
      id: '3',
      tenantId: 't1',
      orderNumber: 3,
      customerId: 'c1',
      status: 'PENDING',
      dueDate: new Date(),
      totalValue: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
      publicId: 'pub3',
      customer: {
        id: 'c1',
        tenantId: 't1',
        name: 'John',
        priority: 'NORMAL',
        status: 'ACTIVE',
        phone: null,
        email: null,
        address: null,
        notes: null,
        birthday: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      items: [
        {
          id: 'oi3',
          orderId: '3',
          productId: 'p3',
          quantity: 1,
          price: 50,
          product: {
            id: 'p3',
            tenantId: 't1',
            name: 'Polo Shirt', // Prefix match for 'Polo'
            materials: [],
          } as unknown as SearchOrder['items'][number]['product'],
        },
      ],
    },
  ] as unknown as SearchOrder[]

  describe('searchOrders', () => {
    it('should search by customer name', () => {
      const results = searchOrders(mockOrders, { query: 'João' })
      expect(results).toHaveLength(1)
      expect(results[0].customer.name).toBe('João Silva')
    })

    it('should sort search results by relevance', () => {
      const results = searchOrders(mockOrders, { query: 'Polo' })
      expect(results).toHaveLength(2)
      expect(results[0].items[0].product.name).toBe('Polo Shirt') // Prefix (3)
      expect(results[1].items[0].product.name).toBe('Camisa Polo') // Contains (2)
    })

    it('should search by customer name precisely', () => {
      const results = searchOrders(mockOrders, { query: 'João Silva' })
      expect(results[0].id).toBe('1') // Exact match on name

      const results2 = searchOrders(mockOrders, { query: 'Silva' })
      expect(results2).toHaveLength(1)
      expect(results2[0].id).toBe('1')
    })

    it('should search by product name', () => {
      const results = searchOrders(mockOrders, { query: 'Vestido' })
      expect(results).toHaveLength(1)
      expect(results[0].items[0].product.name).toBe('Vestido')
    })

    it('should filter by status', () => {
      const results = searchOrders(mockOrders, { status: 'PENDING' })
      expect(results).toHaveLength(2) // ORD-001 and ORD-003
      expect(results[0].status).toBe('PENDING')
    })

    it('should filter by value range', () => {
      const results = searchOrders(mockOrders, { minValue: 150 })
      expect(results).toHaveLength(1)
      expect(results[0].totalValue).toBe(200)
    })

    it('should combine multiple filters', () => {
      const results = searchOrders(mockOrders, {
        status: 'DELIVERED',
        minValue: 100,
      })
      expect(results).toHaveLength(1)
      expect(results[0].status).toBe('DELIVERED')
    })

    it('should filter by date range', () => {
      const results = searchOrders(mockOrders, {
        startDate: new Date('2026-01-18'),
        endDate: new Date('2026-01-22'),
      })
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('1')
    })

    it('should filter by max value', () => {
      const results = searchOrders(mockOrders, { maxValue: 150 })
      expect(results).toHaveLength(2) // ORD-001 (100) and ORD-003 (50)
    })

    it('should filter by customerId', () => {
      const results = searchOrders(mockOrders, { customerId: 'c2' })
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('2')
    })
  })

  describe('searchProducts', () => {
    const mockProducts = [
      {
        id: 'p1',
        tenantId: 't1',
        name: 'Camisa Polo',
        imageUrl: null,
        laborTime: 60,
        profitMargin: 50,
        materials: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'p2',
        tenantId: 't1',
        name: 'Vestido Longo',
        imageUrl: null,
        laborTime: 120,
        profitMargin: 60,
        materials: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as unknown as SearchProduct[]

    it('should find exact matches', () => {
      const results = searchProducts(mockProducts, 'Camisa')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Camisa Polo')
    })

    it('should calculate labor cost with default hourly rate', () => {
      expect(calculateLaborCost(60)).toBe(HOURLY_RATE)
    })

    it('should calculate labor cost with default hourly rate', () => {
      expect(calculateLaborCost(60)).toBe(HOURLY_RATE)
    })

    it('should handle relevance scoring tiers', () => {
      const items = [
        { name: 'PaperCraft', materials: [] }, // Exact
        { name: 'Paper', materials: [] }, // Exact (if query is Paper)
        { name: 'Paper Rolls', materials: [] }, // StartsWith
        { name: 'Artistic Paper', materials: [] }, // Includes
        { name: 'P_a_p_e_r', materials: [] }, // Fuzzy
      ] as unknown as SearchProduct[]

      const results = searchProducts(items, 'Paper')
      expect(results[0].name).toBe('Paper')
      expect(results[1].name).toBe('PaperCraft')
      expect(results[2].name).toBe('Paper Rolls')
      expect(results[3].name).toBe('Artistic Paper')
      expect(results[4].name).toBe('P_a_p_e_r')
    })

    it('should search products by material name', () => {
      const prodWithMats = [
        {
          id: 'p1',
          name: 'Prod',
          materials: [{ material: { name: 'Gold' } }],
        },
      ] as unknown as SearchProduct[]
      const results = searchProducts(prodWithMats, 'Gold')
      expect(results).toHaveLength(1)
    })

    it('should sort products by relevance', () => {
      const products = [
        { id: '1', name: 'Apple', materials: [] },
        { id: '2', name: 'Pineapple', materials: [] },
      ] as unknown as SearchProduct[]
      const results = searchProducts(products, 'Apple')
      expect(results[0].id).toBe('1') // Exact match first
    })
  })

  describe('searchMaterials', () => {
    const mockMaterials: SearchMaterial[] = [
      {
        id: 'm1',
        tenantId: 't1',
        name: 'Tecido Algodão',
        unit: 'm',
        cost: 50,
        quantity: 100,
        minQuantity: 10,
        supplierId: null,
        colors: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'm2',
        tenantId: 't1',
        name: 'Linha Poliéster',
        unit: 'un',
        cost: 5,
        quantity: 200,
        minQuantity: 20,
        supplierId: null,
        colors: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    it('should search materials by name', () => {
      const results = searchMaterials(mockMaterials, 'Tecido')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Tecido Algodão')
    })

    it('should sort materials by relevance', () => {
      const results = searchMaterials(mockMaterials, 'linha')
      expect(results[0].name).toBe('Linha Poliéster')
    })

    it('should sort materials by relevance with multiple items', () => {
      const mats = [
        { id: '1', name: 'Cotton Fabric', colors: [] },
        { id: '2', name: 'Cotton', colors: [] },
      ] as unknown as SearchMaterial[]
      const results = searchMaterials(mats, 'Cotton')
      expect(results[0].name).toBe('Cotton') // Exact match first
    })
  })

  describe('searchCustomers', () => {
    const mockCustomers: SearchCustomer[] = [
      {
        id: 'c1',
        tenantId: 't1',
        name: 'João Silva',
        phone: '11987654321',
        email: 'joao@example.com',
        address: null,
        notes: null,
        birthday: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'c2',
        tenantId: 't1',
        name: 'Maria Santos',
        phone: '11976543210',
        email: 'maria@example.com',
        address: null,
        notes: null,
        birthday: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    it('should search by name', () => {
      const results = searchCustomers(mockCustomers, 'João')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('João Silva')
    })

    it('should search by phone', () => {
      const results = searchCustomers(mockCustomers, '11987654321')
      expect(results).toHaveLength(1)
      expect(results[0].phone).toBe('11987654321')
    })

    it('should search by email', () => {
      const results = searchCustomers(mockCustomers, 'maria@')
      expect(results).toHaveLength(1)
      expect(results[0].email).toBe('maria@example.com')
    })

    it('should sort customers by relevance', () => {
      const customers = [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'John' },
      ] as unknown as SearchCustomer[]
      const results = searchCustomers(customers, 'John')
      expect(results[0].name).toBe('John') // Exact match first
    })
  })

  describe('highlightMatch', () => {
    it('should highlight matching text', () => {
      const result = highlightMatch('Hello World', 'Hello')
      expect(result).toBe('<mark>Hello</mark> World')
    })

    it('should be case insensitive', () => {
      const result = highlightMatch('Hello World', 'hello')
      expect(result).toBe('<mark>Hello</mark> World')
    })

    it('should return original text if no query', () => {
      expect(highlightMatch('Hello', '')).toBe('Hello')
    })
  })

  describe('getSearchSuggestions', () => {
    const items = ['Camisa Polo', 'Vestido Longo', 'Linha Poliéster']

    it('should return suggestions matching query', () => {
      const results = getSearchSuggestions('polo', items)
      expect(results).toContain('Camisa Polo')
    })

    it('should return empty for short queries', () => {
      expect(getSearchSuggestions('a', items)).toEqual([])
    })

    it('should limit results to 5', () => {
      const manyItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6']
      expect(getSearchSuggestions('Item', manyItems)).toHaveLength(5)
    })
  })
})
