'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { createProduct, updateProduct } from '@/features/products/actions'
import { AppSettings, Material } from '@/lib/types'
import { Plus, Trash2, Pencil, Package, Wand2, TrendingUp } from 'lucide-react'
import { applyPsychologicalPricing, type PsychologicalPattern } from '@/lib/finance/intelligence'
import { useFormHandler } from '@/hooks/use-form-handler'
import { calculateMaterialCost, calculateSuggestedPrice, ProductWithMaterials } from '@/lib/logic'
import { UNITS } from '@/lib/units'
import { toast } from 'sonner'

type MaterialItem = {
  id: string
  quantity: number
  unit: string
  color: string | null
}

const PSYCHOLOGICAL_PATTERNS: readonly PsychologicalPattern[] = ['90', '99', '97', 'round']

function isPsychologicalPattern(value: unknown): value is PsychologicalPattern {
  return typeof value === 'string' && PSYCHOLOGICAL_PATTERNS.includes(value as PsychologicalPattern)
}

import { PlanType } from '@/features/subscription/types'
import { isReseller, isFreePlan } from '@/features/subscription/utils'
import { UpgradeLock } from '@/components/upgrade-lock'

export function ProductForm({
  availableMaterials,
  product,
  settings,
  tenantPlan = 'free_creative',
}: {
  availableMaterials: Material[]
  product?: ProductWithMaterials
  settings: AppSettings
  tenantPlan?: PlanType
}) {
  const hourlyRate = Number(settings?.hourlyRate || 20)
  const monthlyFixedCosts = settings?.monthlyFixedCosts || []
  const workingHoursPerMonth = Number(settings?.workingHoursPerMonth || 160)
  const taxRate = Number(settings?.taxRate || 0)
  const cardFeeRate = Number(settings?.cardFeeRate || 0)
  const action = product ? updateProduct.bind(null, product.id) : createProduct

  const { open, setOpen, state, formAction, isPending } = useFormHandler(action)

  // Form fields state (now controlled to prevent data loss on re-renders)
  const [name, setName] = useState(product?.name || '')
  const [laborTime, setLaborTime] = useState(product?.laborTime?.toString() || '')
  const [profitMargin, setProfitMargin] = useState(product?.profitMargin?.toString() || '')
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '')
  const [description, setDescription] = useState(product?.description || '')
  const [price, setPrice] = useState(product?.price?.toString() || '')

  // Local state for material composition
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialItem[]>([])
  const [currentMaterialId, setCurrentMaterialId] = useState('')
  const [currentQuantity, setCurrentQuantity] = useState('')
  const [currentUnit, setCurrentUnit] = useState('')
  const [currentColor, setCurrentColor] = useState('')

  const getMaterialColors = (matId: string) => {
    const mat = availableMaterials.find(m => m.id === matId)
    return mat?.colors || []
  }

  // Reset/Init form when opening/mode changes
  useEffect(() => {
    if (open) {
      if (product) {
        setName(product.name)
        setLaborTime(product.laborTime.toString())
        setProfitMargin(product.profitMargin.toString())
        setImageUrl(product.imageUrl || '')
        setDescription(product.description || '')
        setPrice(product.price?.toString() || '')
        setSelectedMaterials(
          product.materials.map(pm => ({
            id: pm.materialId,
            quantity: pm.quantity,
            unit: pm.unit,
            color: pm.color || null,
          }))
        )
      } else {
        setName('')
        setLaborTime('')
        setProfitMargin('')
        setImageUrl('')
        setDescription('')
        setPrice('')
        setSelectedMaterials([])
      }
    }
  }, [open, product])

  const addMaterial = () => {
    if (!currentMaterialId || !currentQuantity || !currentUnit) {
      toast.error('Preencha todos os campos do material.')
      return
    }

    const exists = selectedMaterials.find(m => m.id === currentMaterialId)
    if (exists) {
      toast.error('Este material já foi adicionado.')
      return
    }

    const quantity = parseFloat(currentQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero.')
      return
    }

    setSelectedMaterials([
      ...selectedMaterials,
      {
        id: currentMaterialId,
        quantity: quantity,
        unit: currentUnit,
        color: currentColor || null,
      },
    ])
    setCurrentMaterialId('')
    setCurrentQuantity('')
    setCurrentUnit('')
    setCurrentColor('')
  }

  const removeMaterial = (id: string) => {
    setSelectedMaterials(selectedMaterials.filter(m => m.id !== id))
  }

  // Calculate generic total cost for preview using centralized logic
  const previewMaterials = selectedMaterials
    .map(item => {
      const mat = availableMaterials.find(m => m.id === item.id)
      if (!mat) return null
      return {
        material: mat,
        quantity: item.quantity,
        unit: item.unit,
        productId: '',
        materialId: item.id,
        color: item.color,
        id: 'temp-' + item.id,
      }
    })
    .filter((pm): pm is NonNullable<typeof pm> => pm !== null)

  const totalCost = calculateMaterialCost(previewMaterials)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {product ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar produto"
            className="text-muted-foreground hover:text-primary h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>Novo Produto</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[98vh] overflow-y-auto border-none bg-transparent p-0 shadow-none sm:max-w-5xl md:p-0">
        <form
          action={formAction}
          className="bg-background flex h-full flex-col overflow-hidden rounded-xl border shadow-lg"
          onSubmit={e => {
            if (!isReseller(tenantPlan) && selectedMaterials.length === 0) {
              e.preventDefault()
              toast.error('Adicione pelo menos um material ao produto.')
              return
            }
          }}
        >
          <DialogHeader className="border-b p-4 pb-2 md:p-6">
            <DialogTitle className="text-xl">
              {product ? 'Editar Produto' : 'Cadastrar Produto'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define a ficha técnica e preço do produto.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-0 lg:grid-cols-12">
              {/* Left Column: Composition */}
              <div className="space-y-6 p-4 md:p-6 lg:col-span-7">
                <div className="grid gap-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="grid gap-1.5 md:col-span-2">
                      <Label
                        htmlFor="name"
                        className="text-muted-foreground/70 text-xs font-bold uppercase"
                      >
                        Nome do Produto
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ex: Necessaire Floral"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="h-9"
                        required
                      />
                      {state.errors?.name && (
                        <p className="text-[10px] text-red-500">{state.errors.name[0]}</p>
                      )}
                    </div>

                    <div className="grid gap-1.5 md:col-span-4">
                      <Label
                        htmlFor="description"
                        className="text-muted-foreground/70 text-xs font-bold uppercase"
                      >
                        Descrição do Produto
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Ex: Ideal para presentes, feito com tecido impermeável..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                    </div>

                    {!isReseller(tenantPlan) && (
                      <div className="grid gap-1.5 md:col-span-2">
                        <Label
                          htmlFor="laborTime"
                          className="text-muted-foreground/70 text-xs font-bold uppercase"
                        >
                          Produção (min)
                        </Label>
                        <Input
                          id="laborTime"
                          name="laborTime"
                          type="number"
                          placeholder="0"
                          value={laborTime}
                          onChange={e => setLaborTime(e.target.value)}
                          className="h-9"
                          required
                        />
                        {state.errors?.laborTime && (
                          <p className="text-[10px] text-red-500">{state.errors.laborTime[0]}</p>
                        )}
                      </div>
                    )}
                    <div className="grid gap-1.5 md:col-span-2">
                      <Label
                        htmlFor="profitMargin"
                        className="text-muted-foreground/70 text-xs font-bold uppercase"
                      >
                        Margem (%)
                      </Label>
                      <Input
                        id="profitMargin"
                        name="profitMargin"
                        type="number"
                        placeholder="50"
                        value={profitMargin}
                        onChange={e => setProfitMargin(e.target.value)}
                        className="h-9"
                        required
                      />
                      {state.errors?.profitMargin && (
                        <p className="text-[10px] text-red-500">{state.errors.profitMargin[0]}</p>
                      )}
                    </div>

                    <div className="mt-1 grid gap-1.5 md:col-span-4">
                      <Label
                        htmlFor="imageUrl"
                        className="text-muted-foreground/70 text-xs font-bold uppercase"
                      >
                        URL da Imagem
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="imageUrl"
                          name="imageUrl"
                          placeholder="https://exemplo.com/imagem.jpg"
                          value={imageUrl}
                          className="h-8 flex-1 text-xs"
                          onChange={e => setImageUrl(e.target.value)}
                        />
                        {imageUrl && (
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageUrl}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Material Composition */}
                  {!isReseller(tenantPlan) ? (
                    <div className="space-y-3">
                      <Label className="text-muted-foreground/70 text-xs font-bold tracking-wider uppercase">
                        Composição de Materiais
                      </Label>

                      <div className="bg-muted/30 space-y-2 rounded-xl border border-dashed p-3">
                        {/* Desktop Header Labels */}
                        <div className="mb-1 hidden grid-cols-12 gap-2 px-1 md:grid">
                          <div className="text-muted-foreground text-[10px] font-bold uppercase md:col-span-5">
                            Material
                          </div>
                          <div className="text-muted-foreground text-center text-[10px] font-bold uppercase md:col-span-2">
                            Cor
                          </div>
                          <div className="text-muted-foreground text-center text-[10px] font-bold uppercase md:col-span-2">
                            Qtd
                          </div>
                          <div className="text-muted-foreground text-center text-[10px] font-bold uppercase md:col-span-2">
                            Unid
                          </div>
                          <div className="md:col-span-1"></div>
                        </div>

                        <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-12">
                          <div className="md:col-span-5">
                            <div className="text-muted-foreground mb-1 text-[10px] font-bold uppercase md:hidden">
                              Material
                            </div>
                            <Select value={currentMaterialId} onValueChange={setCurrentMaterialId}>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableMaterials.map(m => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name} ({m.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="md:col-span-2">
                            <div className="text-muted-foreground mb-1 text-center text-[10px] font-bold uppercase md:hidden">
                              Cor
                            </div>
                            <Select
                              value={currentColor}
                              onValueChange={setCurrentColor}
                              disabled={
                                !currentMaterialId ||
                                getMaterialColors(currentMaterialId).length === 0
                              }
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="-" />
                              </SelectTrigger>
                              <SelectContent>
                                {getMaterialColors(currentMaterialId).map(c => (
                                  <SelectItem key={c} value={c}>
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="md:col-span-2">
                            <div className="text-muted-foreground mb-1 text-center text-[10px] font-bold uppercase md:hidden">
                              Qtd
                            </div>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="0.00"
                              value={currentQuantity}
                              className="h-10 text-center"
                              onChange={e => setCurrentQuantity(e.target.value)}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <div className="text-muted-foreground mb-1 text-center text-[10px] font-bold uppercase md:hidden">
                              Unid
                            </div>
                            <Select value={currentUnit} onValueChange={setCurrentUnit}>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Unid" />
                              </SelectTrigger>
                              <SelectContent>
                                {UNITS.map(u => (
                                  <SelectItem key={u.value} value={u.value}>
                                    {u.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="md:col-span-1">
                            <Button
                              type="button"
                              size="icon"
                              aria-label="Adicionar material"
                              onClick={addMaterial}
                              className="h-10 w-full shadow-sm transition-all active:scale-95"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* List of added materials */}
                      {selectedMaterials.length > 0 && (
                        <div className="bg-muted/20 max-h-[300px] space-y-2 overflow-y-auto rounded border p-2">
                          {selectedMaterials.map(item => {
                            const mat = availableMaterials.find(m => m.id === item.id)
                            const costNode = mat
                              ? ((mat.cost || 0) * item.quantity).toFixed(2)
                              : '?'
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex flex-col">
                                  <span>
                                    {mat?.name} ({item.quantity} {item.unit})
                                  </span>
                                  {item.color && (
                                    <span className="text-muted-foreground text-[10px]">
                                      Cor: {item.color}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">R$ {costNode}</span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    aria-label={`Remover material ${mat?.name || ''}`.trim()}
                                    onClick={() => removeMaterial(item.id)}
                                    className="text-destructive h-6 w-6 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                          <div className="bg-background/95 sticky bottom-0 border-t px-2 pt-2 text-right text-xs font-bold backdrop-blur-sm">
                            Custo Materiais: R$ {totalCost.toFixed(2)}
                          </div>
                        </div>
                      )}

                      {state.errors?.materials && (
                        <p className="mt-2 text-xs text-red-500">{state.errors.materials[0]}</p>
                      )}
                      <input
                        type="hidden"
                        name="materials"
                        value={JSON.stringify(selectedMaterials)}
                      />
                    </div>
                  ) : (
                    <div className="bg-muted/20 flex h-20 flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center">
                      <Package className="text-muted-foreground mb-1 h-5 w-5 opacity-20" />
                      <p className="text-muted-foreground max-w-xs text-[10px] font-medium">
                        Em modo Revenda, o produto é tratado como item acabado único.
                      </p>
                      <input type="hidden" name="materials" value="[]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Pricing Simulation */}
              <div className="bg-primary/5 flex h-full flex-col justify-between border-l p-4 md:p-6 lg:col-span-5">
                <div className="space-y-6">
                  <div className="text-primary border-primary/20 flex items-center gap-2 border-b pb-3">
                    <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
                    <h4 className="text-sm font-bold tracking-widest uppercase">
                      Simulação de Preço
                    </h4>
                  </div>

                  <div className="space-y-4">
                    {isReseller(tenantPlan) ? (
                      <div className="flex items-end justify-between border-b pb-2">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs font-bold tracking-tight uppercase">
                            Custo de Aquisição (MPM)
                          </span>
                          <span className="text-muted-foreground text-[10px] italic">
                            Média ponderada + frete
                          </span>
                        </div>
                        <span className="text-sm font-semibold">
                          R$ {(product?.cost || 0).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-end justify-between border-b pb-2">
                        <span className="text-muted-foreground text-xs font-bold tracking-tight uppercase">
                          Custo Materiais
                        </span>
                        <span className="text-sm font-semibold">R$ {totalCost.toFixed(2)}</span>
                      </div>
                    )}

                    {!isReseller(tenantPlan) && (
                      <div className="flex items-end justify-between border-b pb-2">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs font-bold tracking-tight uppercase">
                            Mão de Obra / Preparo
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {laborTime || 0} min x R$ {(hourlyRate / 60).toFixed(2)}/min
                          </span>
                        </div>
                        <span className="text-sm font-semibold">
                          R$ {((Number(laborTime || 0) / 60) * hourlyRate).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {!isReseller(tenantPlan) && (
                      <div className="flex items-end justify-between border-b pb-2">
                        <span className="text-muted-foreground text-xs font-bold tracking-tight uppercase">
                          Custos Fixos (Prop.)
                        </span>
                        <span className="text-sm font-semibold">
                          R${' '}
                          {(() => {
                            const totalMonthlyFixed = monthlyFixedCosts.reduce(
                              (acc, item) =>
                                acc +
                                Number(item.value ?? item.amount ?? item.valor ?? item.custo ?? 0),
                              0
                            )
                            const fixedCostPerHour =
                              workingHoursPerMonth > 0
                                ? totalMonthlyFixed / workingHoursPerMonth
                                : 0
                            return ((Number(laborTime || 0) / 60) * fixedCostPerHour).toFixed(2)
                          })()}
                        </span>
                      </div>
                    )}

                    {/* Centralized Price Calculation Result */}
                    {(() => {
                      const simulation = calculateSuggestedPrice(
                        {
                          laborTime: Number(laborTime || 0),
                          profitMargin: Number(profitMargin || 0),
                          materials: previewMaterials,
                          cost: isReseller(tenantPlan) ? product?.cost || 0 : 0,
                        },
                        hourlyRate,
                        monthlyFixedCosts,
                        workingHoursPerMonth,
                        taxRate,
                        cardFeeRate
                      )

                      return (
                        <div className="space-y-4">
                          <div className="flex items-baseline justify-between pt-2">
                            <span className="text-foreground text-sm font-black uppercase">
                              Custo Total (Base)
                            </span>
                            <span className="text-lg font-black">
                              R$ {simulation.baseCost.toFixed(2)}
                            </span>
                          </div>

                          {!isFreePlan(tenantPlan) ? (
                            <div className="text-success bg-success/10 border-success/20 flex items-end justify-between rounded-lg border p-3">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black tracking-widest uppercase">
                                  Lucro Estimado
                                </span>
                                <span className="text-[10px] opacity-80">
                                  ({profitMargin || 0}% de margem)
                                </span>
                              </div>
                              <span className="text-md font-black">
                                + R$ {simulation.marginValue.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <UpgradeLock
                              message="Lucro Real disponível apenas no Premium"
                              size="sm"
                            />
                          )}

                          {/* Profitability Radar (Adaptive Feedback) */}
                          {!isFreePlan(tenantPlan) ? (
                            <div className="bg-muted/30 grid grid-cols-2 gap-2 rounded-xl border border-dashed p-4">
                              <div className="flex flex-col">
                                <span className="text-muted-foreground text-[9px] font-black uppercase">
                                  {settings.financialDisplayMode === 'advanced'
                                    ? 'Margem de Contribuição'
                                    : 'Sobra p/ seu bolso'}
                                </span>
                                <span
                                  className={`text-sm font-bold ${
                                    simulation.contributionMarginPercentage >=
                                    (settings.marginThresholdOptimal || 40)
                                      ? 'text-green-600'
                                      : simulation.contributionMarginPercentage >=
                                          (settings.marginThresholdWarning || 20)
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                  }`}
                                >
                                  R$ {simulation.contributionMargin.toFixed(2)} (
                                  {simulation.contributionMarginPercentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-muted-foreground text-[9px] font-black uppercase">
                                  {settings.financialDisplayMode === 'advanced'
                                    ? 'Ponto de Equilíbrio'
                                    : 'Meta de Vendas'}
                                </span>
                                <span className="text-foreground text-sm font-bold">
                                  {simulation.breakEvenUnits === Infinity
                                    ? '∞'
                                    : simulation.breakEvenUnits}{' '}
                                  {settings.financialDisplayMode === 'advanced'
                                    ? 'unidades'
                                    : 'p/ pagar as contas'}
                                </span>
                              </div>
                              <div className="col-span-2 mt-1 border-t border-dashed pt-2">
                                <div className="text-muted-foreground flex items-center justify-between text-[9px] font-black uppercase">
                                  <span>
                                    {settings.financialDisplayMode === 'advanced'
                                      ? 'MPM (Custo Base + Taxas)'
                                      : 'Custos da Venda (Taxas + Materiais)'}
                                  </span>
                                  <span>R$ {simulation.variableCostsTotal.toFixed(2)}</span>
                                </div>
                                {settings.financialDisplayMode === 'advanced' && (
                                  <div className="border-primary/10 mt-2 space-y-1 border-l-2 pl-2">
                                    <div className="text-muted-foreground/60 flex items-center justify-between text-[8px] font-bold uppercase">
                                      <span>Mão de Obra + Fixos</span>
                                      <span>
                                        R${' '}
                                        {(simulation.laborCost + simulation.fixedCost).toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="text-muted-foreground/60 flex items-center justify-between text-[8px] font-bold uppercase">
                                      <span>Materiais / Produto</span>
                                      <span>R$ {simulation.materialCost.toFixed(2)}</span>
                                    </div>
                                    <div className="text-muted-foreground/60 flex items-center justify-between text-[8px] font-bold uppercase">
                                      <span>Impostos (Venda)</span>
                                      <span>
                                        R$ {simulation.taxAmount.toFixed(2)} ({settings.taxRate}%)
                                      </span>
                                    </div>
                                    <div className="text-muted-foreground/60 flex items-center justify-between text-[8px] font-bold uppercase">
                                      <span>Taxas de Cartão</span>
                                      <span>
                                        R$ {simulation.cardFeeAmount.toFixed(2)} (
                                        {settings.cardFeeRate}% )
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <UpgradeLock message="Análise de Margem e Ponto de Equilíbrio bloqueada no plano Grátis." />
                          )}

                          <div className="mt-8 border-t pt-4">
                            <div className="flex items-center justify-between px-1">
                              <Label
                                htmlFor="price"
                                className="text-muted-foreground text-[10px] font-black uppercase"
                              >
                                Preço Final (Venda)
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const rawPattern = settings.psychologicalPricingPattern
                                  const pattern = isPsychologicalPattern(rawPattern)
                                    ? rawPattern
                                    : '90'
                                  const refined = applyPsychologicalPricing(
                                    simulation.suggestedPrice,
                                    pattern
                                  )
                                  setPrice(refined.toString())
                                }}
                                className="text-primary hover:text-primary hover:bg-primary/5 h-6 gap-1 text-[9px] font-black tracking-widest uppercase"
                              >
                                <Wand2 size={10} /> Aplicar Arredondamento (
                                {settings.psychologicalPricingPattern || '90'})
                              </Button>
                            </div>
                            <div className="relative mt-2">
                              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-bold italic">
                                R$
                              </span>
                              <Input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                placeholder="Deixe em branco para sugerido"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                className="text-md h-10 pl-10 font-black"
                              />
                            </div>
                          </div>

                          <div className="mt-8 space-y-4">
                            <div className="bg-primary text-primary-foreground shadow-primary/20 flex transform flex-col rounded-2xl p-5 shadow-xl transition-all hover:scale-[1.02]">
                              <span className="mb-1 text-center text-xs font-black tracking-[0.2em] uppercase opacity-80">
                                Preço Sugerido
                              </span>
                              <span className="text-center text-4xl font-black tabular-nums">
                                R$ {simulation.suggestedPrice.toFixed(2)}
                              </span>
                            </div>

                            {state.message && (
                              <p
                                className={`text-center text-sm font-medium ${state.success ? 'text-green-600' : 'text-red-500'}`}
                              >
                                {state.message}
                              </p>
                            )}

                            <Button
                              type="submit"
                              size="lg"
                              className="h-14 w-full text-lg font-semibold tracking-widest uppercase"
                              disabled={isPending}
                            >
                              {isPending ? 'Salvando...' : 'Salvar Produto'}
                            </Button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
