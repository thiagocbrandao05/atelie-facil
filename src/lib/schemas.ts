import { z } from 'zod'

// Business validation constants
const MAX_QUANTITY = 999999
const MAX_PRICE = 1000000
const MAX_STRING_LENGTH = 500
const MAX_ITEMS_PER_ORDER = 50
const ORDER_STATUSES = [
  'QUOTATION',
  'PENDING',
  'PRODUCING',
  'READY',
  'DELIVERED',
  'CANCELLED',
] as const

export const MaterialSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').max(100, 'Nome muito longo'),
  unit: z.string().min(1, 'Unidade e obrigatoria').max(20, 'Unidade muito longa'),
  quantity: z.coerce
    .number()
    .min(0, 'Quantidade deve ser positiva')
    .max(MAX_QUANTITY, 'Quantidade maxima excedida'),
  minQuantity: z.coerce.number().min(0).max(MAX_QUANTITY).nullable().optional(),
  supplierId: z.string().optional().or(z.literal('')),
})

export const ProductMaterialSchema = z.object({
  id: z.string().min(1, 'Material e obrigatorio'),
  quantity: z.coerce
    .number()
    .min(0.001, 'Quantidade deve ser maior que zero')
    .max(MAX_QUANTITY, 'Quantidade maxima excedida'),
  unit: z.string().min(1, 'Unidade e obrigatoria'),
  color: z.string().optional().nullable(),
})

export const ProductSchema = z
  .object({
    name: z.string().min(1, 'Nome e obrigatorio').max(100, 'Nome muito longo'),
    imageUrl: z.string().url('URL invalida').optional().or(z.literal('')).or(z.null()),
    description: z
      .string()
      .max(MAX_STRING_LENGTH, 'Descricao muito longa')
      .optional()
      .or(z.literal(''))
      .or(z.null()),
    price: z.coerce
      .number()
      .min(0, 'Preco deve ser positivo')
      .max(MAX_PRICE, 'Preco muito alto')
      .optional()
      .or(z.null()),
    laborTime: z.coerce
      .number()
      .int('Tempo deve ser um numero inteiro')
      .min(0, 'Tempo de producao deve ser positivo')
      .max(10000, 'Tempo muito alto (max: 10000 minutos)'),
    profitMargin: z.coerce
      .number()
      .min(0, 'Margem de lucro deve ser positiva')
      .max(1000, 'Margem muito alta (max: 1000%)'),
    materials: z.array(ProductMaterialSchema).max(50, 'Maximo 50 materiais por produto'),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>()

    data.materials.forEach((material, index) => {
      const key = material.id.trim()
      if (!key) return

      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['materials', index, 'id'],
          message: 'Material duplicado na composicao.',
        })
        return
      }

      seen.add(key)
    })
  })

export const OrderItemSchema = z
  .object({
    productId: z.string().min(1, 'Produto e obrigatorio'),
    quantity: z.coerce
      .number()
      .int('Quantidade deve ser um numero inteiro')
      .min(1, 'Quantidade deve ser pelo menos 1')
      .max(1000, 'Quantidade maxima: 1000 unidades'),
    price: z.coerce.number().min(0, 'Preco deve ser positivo').max(MAX_PRICE, 'Preco muito alto'),
    discount: z.coerce
      .number()
      .min(0, 'Desconto deve ser positivo')
      .max(MAX_PRICE, 'Desconto nao pode ser maior que o preco')
      .optional()
      .default(0),
  })
  .superRefine((data, ctx) => {
    if ((data.discount || 0) > data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discount'],
        message: 'Desconto do item nao pode ser maior que o preco unitario.',
      })
    }
  })

export const CustomerSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').max(100, 'Nome muito longo'),
  phone: z.string().max(20, 'Telefone muito longo').optional().or(z.literal('')),
  email: z
    .string()
    .email('E-mail invalido')
    .max(100, 'E-mail muito longo')
    .optional()
    .or(z.literal('')),
  address: z.string().max(MAX_STRING_LENGTH, 'Endereco muito longo').optional().or(z.literal('')),
  notes: z.string().max(MAX_STRING_LENGTH, 'Observacoes muito longas').optional().or(z.literal('')),
  birthday: z.coerce.date().nullable().optional(),
})

export const OrderSchema = z
  .object({
    customerId: z.string().min(1, 'Selecione um cliente'),
    dueDate: z.coerce.date().refine(date => date > new Date(), {
      message: 'Data de entrega deve ser futura',
    }),
    items: z
      .array(OrderItemSchema)
      .min(1, 'Adicione pelo menos um item ao pedido')
      .max(MAX_ITEMS_PER_ORDER, `Maximo ${MAX_ITEMS_PER_ORDER} itens por pedido`),
    status: z.enum(ORDER_STATUSES).optional(),
    discount: z.coerce
      .number()
      .min(0, 'Desconto deve ser positivo')
      .max(MAX_PRICE * MAX_ITEMS_PER_ORDER, 'Desconto muito alto')
      .optional()
      .default(0),
  })
  .superRefine((data, ctx) => {
    const seenProducts = new Set<string>()

    data.items.forEach((item, index) => {
      const key = item.productId.trim()
      if (!key) return

      if (seenProducts.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'productId'],
          message: 'Produto repetido no pedido. Ajuste a quantidade no mesmo item.',
        })
        return
      }

      seenProducts.add(key)
    })

    const itemsTotal = data.items.reduce((sum, item) => {
      return sum + (item.price - (item.discount || 0)) * item.quantity
    }, 0)

    if ((data.discount || 0) > itemsTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discount'],
        message: 'Desconto do pedido nao pode ser maior que o total dos itens.',
      })
    }
  })

export const SupplierSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').max(100, 'Nome muito longo'),
  contact: z.string().max(100, 'Contato muito longo').optional().or(z.literal('')),
  phone: z.string().max(20, 'Telefone muito longo').optional().or(z.literal('')),
  email: z
    .string()
    .email('E-mail invalido')
    .max(100, 'E-mail muito longo')
    .optional()
    .or(z.literal('')),
  address: z.string().max(MAX_STRING_LENGTH, 'Endereco muito longo').optional().or(z.literal('')),
  notes: z.string().max(MAX_STRING_LENGTH, 'Observacoes muito longas').optional().or(z.literal('')),
})

// Type exports for use in Server Actions
export type MaterialInput = z.infer<typeof MaterialSchema>
export type ProductInput = z.infer<typeof ProductSchema>
export type OrderInput = z.infer<typeof OrderSchema>
export type CustomerInput = z.infer<typeof CustomerSchema>
export type SupplierInput = z.infer<typeof SupplierSchema>
