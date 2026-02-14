import { z } from 'zod'

// Business validation constants
const MAX_QUANTITY = 999999
const MAX_PRICE = 1000000
const MAX_STRING_LENGTH = 500
const MAX_ITEMS_PER_ORDER = 50

export const MaterialSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  unit: z.string().min(1, 'Unidade é obrigatória').max(20, 'Unidade muito longa'),
  quantity: z.coerce
    .number()
    .min(0, 'Quantidade deve ser positiva')
    .max(MAX_QUANTITY, 'Quantidade máxima excedida'),
  minQuantity: z.coerce.number().min(0).max(MAX_QUANTITY).nullable().optional(),
  supplierId: z.string().optional().or(z.literal('')),
})

export const ProductMaterialSchema = z.object({
  id: z.string().min(1, 'Material é obrigatório'),
  quantity: z.coerce
    .number()
    .min(0.001, 'Quantidade deve ser maior que zero')
    .max(MAX_QUANTITY, 'Quantidade máxima excedida'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  color: z.string().optional().nullable(),
})

export const ProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')).or(z.null()),
  description: z.string().max(MAX_STRING_LENGTH, 'Descrição muito longa').optional().or(z.literal('')).or(z.null()),
  price: z.coerce.number().min(0, 'Preço deve ser positivo').max(MAX_PRICE, 'Preço muito alto').optional().or(z.null()),
  laborTime: z.coerce
    .number()
    .int('Tempo deve ser um número inteiro')
    .min(0, 'Tempo de produção deve ser positivo')
    .max(10000, 'Tempo muito alto (máx: 10000 minutos)'),
  profitMargin: z.coerce
    .number()
    .min(0, 'Margem de lucro deve ser positiva')
    .max(1000, 'Margem muito alta (máx: 1000%)'),
  materials: z
    .array(ProductMaterialSchema)
    .max(50, 'Máximo 50 materiais por produto'),
})

export const OrderItemSchema = z.object({
  productId: z.string().min(1, 'Produto é obrigatório'),
  quantity: z.coerce
    .number()
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade deve ser pelo menos 1')
    .max(1000, 'Quantidade máxima: 1000 unidades'),
  price: z.coerce.number().min(0, 'Preço deve ser positivo').max(MAX_PRICE, 'Preço muito alto'),
  discount: z.coerce
    .number()
    .min(0, 'Desconto deve ser positivo')
    .max(MAX_PRICE, 'Desconto não pode ser maior que o preço')
    .optional()
    .default(0),
})

export const CustomerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  phone: z.string().max(20, 'Telefone muito longo').optional().or(z.literal('')),
  email: z
    .string()
    .email('E-mail inválido')
    .max(100, 'E-mail muito longo')
    .optional()
    .or(z.literal('')),
  address: z.string().max(MAX_STRING_LENGTH, 'Endereço muito longo').optional().or(z.literal('')),
  notes: z.string().max(MAX_STRING_LENGTH, 'Observações muito longas').optional().or(z.literal('')),
  birthday: z.coerce.date().nullable().optional(),
})

export const OrderSchema = z.object({
  customerId: z.string().min(1, 'Selecione um cliente'),
  dueDate: z.coerce.date().refine(date => date > new Date(), {
    message: 'Data de entrega deve ser futura',
  }),
  items: z
    .array(OrderItemSchema)
    .min(1, 'Adicione pelo menos um item ao pedido')
    .max(MAX_ITEMS_PER_ORDER, `Máximo ${MAX_ITEMS_PER_ORDER} itens por pedido`),
  status: z.string().optional(),
  discount: z.coerce
    .number()
    .min(0, 'Desconto deve ser positivo')
    .max(MAX_PRICE * MAX_ITEMS_PER_ORDER, 'Desconto muito alto')
    .optional()
    .default(0),
})

export const SupplierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  contact: z.string().max(100, 'Contato muito longo').optional().or(z.literal('')),
  phone: z.string().max(20, 'Telefone muito longo').optional().or(z.literal('')),
  email: z
    .string()
    .email('E-mail inválido')
    .max(100, 'E-mail muito longo')
    .optional()
    .or(z.literal('')),
  address: z.string().max(MAX_STRING_LENGTH, 'Endereço muito longo').optional().or(z.literal('')),
  notes: z.string().max(MAX_STRING_LENGTH, 'Observações muito longas').optional().or(z.literal('')),
})

// Type exports for use in Server Actions
export type MaterialInput = z.infer<typeof MaterialSchema>
export type ProductInput = z.infer<typeof ProductSchema>
export type OrderInput = z.infer<typeof OrderSchema>
export type CustomerInput = z.infer<typeof CustomerSchema>
export type SupplierInput = z.infer<typeof SupplierSchema>
