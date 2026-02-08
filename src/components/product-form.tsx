'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { createProduct, updateProduct } from '@/features/products/actions'
import { Material } from '@/lib/types'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { useFormHandler } from '@/hooks/use-form-handler'
import { calculateMaterialCost, ProductWithMaterials } from '@/lib/logic'
import { UNITS } from '@/lib/units'

type MaterialItem = {
    id: string
    quantity: number
    unit: string
    color: string | null
}

export function ProductForm({ availableMaterials, product, settings }: { availableMaterials: Material[], product?: ProductWithMaterials, settings: any }) {
    const hourlyRate = Number(settings?.hourlyRate || 20)
    const monthlyFixedCosts = settings?.monthlyFixedCosts || []
    const workingHoursPerMonth = Number(settings?.workingHoursPerMonth || 160)
    const action = product ? updateProduct.bind(null, product.id) : createProduct

    const { open, setOpen, state, formAction, isPending } = useFormHandler(action)

    // Form fields state (now controlled to prevent data loss on re-renders)
    const [name, setName] = useState(product?.name || '')
    const [laborTime, setLaborTime] = useState(product?.laborTime?.toString() || '')
    const [profitMargin, setProfitMargin] = useState(product?.profitMargin?.toString() || '')
    const [imageUrl, setImageUrl] = useState(product?.imageUrl || '')

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
                setSelectedMaterials(product.materials.map(pm => ({
                    id: pm.materialId,
                    quantity: pm.quantity,
                    unit: pm.unit,
                    color: pm.color || null
                })))
            } else {
                setName('')
                setLaborTime('')
                setProfitMargin('')
                setImageUrl('')
                setSelectedMaterials([])
            }
        }
    }, [open, product])

    const addMaterial = () => {
        if (!currentMaterialId || !currentQuantity || !currentUnit) {
            alert('Por favor, preencha todos os campos do material.')
            return
        }

        const exists = selectedMaterials.find(m => m.id === currentMaterialId)
        if (exists) {
            alert('Este material já foi adicionado.')
            return
        }

        const quantity = parseFloat(currentQuantity)
        if (isNaN(quantity) || quantity <= 0) {
            alert('Quantidade deve ser um número maior que zero.')
            return
        }

        setSelectedMaterials([...selectedMaterials, {
            id: currentMaterialId,
            quantity: quantity,
            unit: currentUnit,
            color: currentColor || null
        }])
        setCurrentMaterialId('')
        setCurrentQuantity('')
        setCurrentUnit('')
        setCurrentColor('')
    }

    const removeMaterial = (id: string) => {
        setSelectedMaterials(selectedMaterials.filter(m => m.id !== id))
    }

    // Calculate generic total cost for preview using centralized logic
    const previewMaterials = selectedMaterials.map(item => {
        const mat = availableMaterials.find(m => m.id === item.id)
        return {
            material: mat!,
            quantity: item.quantity,
            unit: item.unit,
            productId: '',
            materialId: item.id,
            color: item.color,
            id: 'temp-' + item.id
        }
    }).filter(pm => pm.material)

    const totalCost = calculateMaterialCost(previewMaterials)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {product ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Pencil className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button>Novo Produto</Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-5xl max-h-[98vh] overflow-y-auto p-0 md:p-0 border-none bg-transparent shadow-none">
                <form action={formAction} className="h-full bg-background rounded-xl border shadow-lg flex flex-col overflow-hidden" onSubmit={(e) => {
                    if (selectedMaterials.length === 0) {
                        e.preventDefault()
                        alert('Adicione pelo menos um material ao produto.')
                        return
                    }
                }}>
                    <DialogHeader className="p-4 md:p-6 pb-2 border-b">
                        <DialogTitle className="text-xl">{product ? 'Editar Produto' : 'Cadastrar Produto'}</DialogTitle>
                        <DialogDescription className="text-xs">
                            Define a ficha técnica e preço do produto.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                            {/* Left Column: Composition */}
                            <div className="lg:col-span-7 p-4 md:p-6 space-y-6">
                                <div className="grid gap-4">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div className="grid gap-1.5 md:col-span-2">
                                            <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground/70">Nome do Produto</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="Ex: Necessaire Floral"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="h-9"
                                                required
                                            />
                                            {state.errors?.name && <p className="text-[10px] text-red-500">{state.errors.name[0]}</p>}
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label htmlFor="laborTime" className="text-xs font-bold uppercase text-muted-foreground/70">Produção (min)</Label>
                                            <Input
                                                id="laborTime"
                                                name="laborTime"
                                                type="number"
                                                placeholder="60"
                                                value={laborTime}
                                                onChange={e => setLaborTime(e.target.value)}
                                                className="h-9"
                                                required
                                            />
                                            {state.errors?.laborTime && <p className="text-[10px] text-red-500">{state.errors.laborTime[0]}</p>}
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="profitMargin" className="text-xs font-bold uppercase text-muted-foreground/70">Margem (%)</Label>
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
                                            {state.errors?.profitMargin && <p className="text-[10px] text-red-500">{state.errors.profitMargin[0]}</p>}
                                        </div>

                                        <div className="grid gap-1.5 md:col-span-4 mt-1">
                                            <Label htmlFor="imageUrl" className="text-xs font-bold uppercase text-muted-foreground/70">URL da Imagem</Label>
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    id="imageUrl"
                                                    name="imageUrl"
                                                    placeholder="https://exemplo.com/imagem.jpg"
                                                    value={imageUrl}
                                                    className="h-8 flex-1 text-xs"
                                                    onChange={e => setImageUrl(e.target.value)}
                                                />
                                                {imageUrl && (
                                                    <div className="relative h-8 w-8 shrink-0 rounded border overflow-hidden">
                                                        <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Material Composition */}
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground/70 tracking-wider">Composição de Materiais</Label>

                                        <div className="bg-muted/30 p-3 rounded-xl border border-dashed space-y-2">
                                            {/* Desktop Header Labels */}
                                            <div className="hidden md:grid grid-cols-12 gap-2 px-1 mb-1">
                                                <div className="md:col-span-5 text-[10px] uppercase font-bold text-muted-foreground">Material</div>
                                                <div className="md:col-span-2 text-[10px] uppercase font-bold text-muted-foreground text-center">Cor</div>
                                                <div className="md:col-span-2 text-[10px] uppercase font-bold text-muted-foreground text-center">Qtd</div>
                                                <div className="md:col-span-2 text-[10px] uppercase font-bold text-muted-foreground text-center">Unid</div>
                                                <div className="md:col-span-1"></div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                                                <div className="md:col-span-5">
                                                    <div className="md:hidden text-[10px] uppercase font-bold text-muted-foreground mb-1">Material</div>
                                                    <Select value={currentMaterialId} onValueChange={setCurrentMaterialId}>
                                                        <SelectTrigger className="h-10">
                                                            <SelectValue placeholder="Selecione..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableMaterials.map(m => (
                                                                <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <div className="md:hidden text-[10px] uppercase font-bold text-muted-foreground mb-1 text-center">Cor</div>
                                                    <Select
                                                        value={currentColor}
                                                        onValueChange={setCurrentColor}
                                                        disabled={!currentMaterialId || getMaterialColors(currentMaterialId).length === 0}
                                                    >
                                                        <SelectTrigger className="h-10">
                                                            <SelectValue placeholder="-" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {getMaterialColors(currentMaterialId).map(c => (
                                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <div className="md:hidden text-[10px] uppercase font-bold text-muted-foreground mb-1 text-center">Qtd</div>
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
                                                    <div className="md:hidden text-[10px] uppercase font-bold text-muted-foreground mb-1 text-center">Unid</div>
                                                    <Select value={currentUnit} onValueChange={setCurrentUnit}>
                                                        <SelectTrigger className="h-10">
                                                            <SelectValue placeholder="Unid" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {UNITS.map(u => (
                                                                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="md:col-span-1">
                                                    <Button type="button" size="icon" onClick={addMaterial} className="w-full h-10 shadow-sm transition-all active:scale-95">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* List of added materials */}
                                        {selectedMaterials.length > 0 && (
                                            <div className="space-y-2 border rounded p-2 bg-muted/20 max-h-[300px] overflow-y-auto">
                                                {selectedMaterials.map(item => {
                                                    const mat = availableMaterials.find(m => m.id === item.id)
                                                    const costNode = mat ? (((mat as any).cost || 0) * item.quantity).toFixed(2) : '?'
                                                    return (
                                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                                            <div className="flex flex-col">
                                                                <span>{mat?.name} ({item.quantity} {item.unit})</span>
                                                                {item.color && (
                                                                    <span className="text-[10px] text-muted-foreground">Cor: {item.color}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-muted-foreground">R$ {costNode}</span>
                                                                <Button type="button" size="sm" variant="ghost" onClick={() => removeMaterial(item.id)} className="h-6 w-6 p-0 text-destructive">
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                <div className="text-right text-xs font-bold pt-2 border-t sticky bottom-0 bg-background/95 backdrop-blur-sm px-2">
                                                    Custo Materiais: R$ {totalCost.toFixed(2)}
                                                </div>
                                            </div>
                                        )}

                                        {state.errors?.materials && <p className="text-xs text-red-500 mt-2">{state.errors.materials[0]}</p>}
                                        <input type="hidden" name="materials" value={JSON.stringify(selectedMaterials)} />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Pricing Simulation */}
                            <div className="lg:col-span-5 bg-primary/5 p-4 md:p-6 border-l flex flex-col justify-between h-full">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-primary border-b border-primary/20 pb-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                        <h4 className="font-bold text-sm uppercase tracking-widest">Simulação de Preço</h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b pb-2">
                                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Custo Materiais</span>
                                            <span className="font-semibold text-sm">R$ {totalCost.toFixed(2)}</span>
                                        </div>

                                        <div className="flex justify-between items-end border-b pb-2">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Mão de Obra</span>
                                                <span className="text-[10px] text-muted-foreground">{laborTime || 0} min x R$ {(hourlyRate / 60).toFixed(2)}/min</span>
                                            </div>
                                            <span className="font-semibold text-sm">R$ {((Number(laborTime || 0) / 60) * hourlyRate).toFixed(2)}</span>
                                        </div>

                                        <div className="flex justify-between items-end border-b pb-2">
                                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Custos Fixos</span>
                                            <span className="font-semibold text-sm">R$ {(() => {
                                                const totalMonthlyFixed = monthlyFixedCosts.reduce((acc: number, item: any) => acc + (Number(item.value) || 0), 0)
                                                const fixedCostPerHour = workingHoursPerMonth > 0 ? totalMonthlyFixed / workingHoursPerMonth : 0
                                                return ((Number(laborTime || 0) / 60) * fixedCostPerHour).toFixed(2)
                                            })()}</span>
                                        </div>

                                        <div className="flex justify-between items-baseline pt-2">
                                            <span className="text-sm font-black uppercase text-foreground">Custo Total (Base)</span>
                                            <span className="font-black text-lg">R$ {(() => {
                                                const totalMonthlyFixed = monthlyFixedCosts.reduce((acc: number, item: any) => acc + (Number(item.value) || 0), 0)
                                                const fixedCostPerHour = workingHoursPerMonth > 0 ? totalMonthlyFixed / workingHoursPerMonth : 0
                                                const fixedCost = (Number(laborTime || 0) / 60) * fixedCostPerHour
                                                return (totalCost + ((Number(laborTime || 0) / 60) * hourlyRate) + fixedCost).toFixed(2)
                                            })()}</span>
                                        </div>

                                        <div className="flex justify-between items-end text-success bg-success/10 p-3 rounded-lg border border-success/20">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-black tracking-widest">Lucro Estimado</span>
                                                <span className="text-[10px] opacity-80">({profitMargin || 0}% de margem)</span>
                                            </div>
                                            <span className="font-black text-md">+ R$ {(() => {
                                                const totalMonthlyFixed = monthlyFixedCosts.reduce((acc: number, item: any) => acc + (Number(item.value) || 0), 0)
                                                const fixedCostPerHour = workingHoursPerMonth > 0 ? totalMonthlyFixed / workingHoursPerMonth : 0
                                                const fixedCost = (Number(laborTime || 0) / 60) * fixedCostPerHour
                                                const baseCost = totalCost + ((Number(laborTime || 0) / 60) * hourlyRate) + fixedCost
                                                return (baseCost * (Number(profitMargin || 0) / 100)).toFixed(2)
                                            })()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-4">
                                    <div className="bg-primary text-primary-foreground p-5 rounded-2xl flex flex-col shadow-xl shadow-primary/20 transform transition-all hover:scale-[1.02]">
                                        <span className="font-black text-xs uppercase tracking-[0.2em] opacity-80 mb-1 text-center">Preço Sugerido</span>
                                        <span className="text-4xl font-black text-center tabular-nums">
                                            R$ {(() => {
                                                const totalMonthlyFixed = monthlyFixedCosts.reduce((acc: number, item: any) => acc + (Number(item.value) || 0), 0)
                                                const fixedCostPerHour = workingHoursPerMonth > 0 ? totalMonthlyFixed / workingHoursPerMonth : 0
                                                const fixedCost = (Number(laborTime || 0) / 60) * fixedCostPerHour
                                                const baseCost = totalCost + ((Number(laborTime || 0) / 60) * hourlyRate) + fixedCost
                                                return (baseCost * (1 + (Number(profitMargin || 0) / 100))).toFixed(2)
                                            })()}
                                        </span>
                                    </div>

                                    {state.message && (
                                        <p className={`text-center text-sm font-medium ${state.success ? 'text-green-600' : 'text-red-500'}`}>
                                            {state.message}
                                        </p>
                                    )}

                                    <Button type="submit" size="lg" className="w-full h-14 text-lg font-semibold uppercase tracking-widest" disabled={isPending}>
                                        {isPending ? 'Salvando...' : 'Salvar Produto'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

