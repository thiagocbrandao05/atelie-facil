'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { createMaterial, updateMaterial } from '@/features/materials/actions'
import { useFormHandler } from '@/hooks/use-form-handler'
import { useRouter } from 'next/navigation'
import { UNITS } from '@/lib/units'
import type { Supplier, Material, ActionResponse } from '@/lib/types'

interface MaterialFormProps {
  suppliers?: Supplier[]
  initialData?: Material
  trigger?: React.ReactNode
}

type MaterialFormActionData = {
  name?: string
  unit?: string
  minQuantity?: string
  supplierId?: string
  colors?: string
  duplicateType?: 'possible'
  canForce?: boolean
  candidates?: Array<{
    id: string
    name: string
    unit: string
    reasons: string[]
  }>
}

function toMinQuantityValue(value?: number | null) {
  if (value === null || value === undefined) return ''
  return String(value)
}

export function MaterialForm({ suppliers = [], initialData, trigger }: MaterialFormProps) {
  const router = useRouter()
  const action = initialData ? updateMaterial.bind(null, initialData.id) : createMaterial

  const { open, setOpen, state, formAction, isPending } = useFormHandler(
    action,
    { success: false, message: '' },
    successState => {
      toast.success(successState.message)
      router.refresh()
    }
  )

  const [localState, setLocalState] = useState<ActionResponse>(state)

  const [name, setName] = useState(initialData?.name || '')
  const [unit, setUnit] = useState(initialData?.unit || '')
  const [colors, setColors] = useState(initialData?.colors?.join(', ') || '')
  const [minQuantity, setMinQuantity] = useState(toMinQuantityValue(initialData?.minQuantity))
  const [supplierId, setSupplierId] = useState(initialData?.supplierId || '')
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)

  const duplicateData = (state?.data as MaterialFormActionData | undefined) ?? undefined
  const possibleDuplicates =
    !state?.success && duplicateData?.duplicateType === 'possible' && duplicateData?.canForce
      ? (duplicateData.candidates ?? [])
      : []
  const hasPossibleDuplicate = possibleDuplicates.length > 0
  const formId = initialData ? `material-form-${initialData.id}` : 'material-form-new'

  useEffect(() => {
    setLocalState(state)

    const actionData = duplicateData
    if (!state.success && actionData) {
      if (typeof actionData.name === 'string') setName(actionData.name)
      if (typeof actionData.unit === 'string') setUnit(actionData.unit)
      if (typeof actionData.colors === 'string') setColors(actionData.colors)
      if (typeof actionData.minQuantity === 'string') setMinQuantity(actionData.minQuantity)
      if (typeof actionData.supplierId === 'string') setSupplierId(actionData.supplierId)
    }
  }, [duplicateData, state])

  useEffect(() => {
    if (state.success) {
      setIsDuplicateModalOpen(false)
      return
    }

    if (hasPossibleDuplicate) {
      setIsDuplicateModalOpen(true)
    }
  }, [hasPossibleDuplicate, state.success])

  useEffect(() => {
    if (!open) {
      setLocalState({ success: false, message: '' })
      setIsDuplicateModalOpen(false)
      if (!initialData) {
        setName('')
        setUnit('')
        setColors('')
        setMinQuantity('')
        setSupplierId('')
      }
      return
    }

    if (initialData) {
      setName(initialData.name || '')
      setUnit(initialData.unit || '')
      setColors(initialData.colors?.join(', ') || '')
      setMinQuantity(toMinQuantityValue(initialData.minQuantity))
      setSupplierId(initialData.supplierId || '')
    }
  }, [open, initialData])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button>Novo Material</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Material' : 'Cadastrar Material'}</DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Atualize as informacoes do material.'
              : 'Cadastre os materiais que voce utiliza. O controle de estoque (entradas/saidas) e feito em abas especificas.'}
          </DialogDescription>
        </DialogHeader>

        <form id={formId} action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Material</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Tecido Algodao"
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />
              {localState.errors?.name && (
                <p className="text-xs text-red-500">{localState.errors.name[0]}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unit">Unidade de Medida</Label>
              <input type="hidden" name="unit" value={unit} />
              <Select value={unit || undefined} onValueChange={setUnit}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {localState.errors?.unit && (
                <p className="text-xs text-red-500">{localState.errors.unit[0]}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="colors">Cores / Variantes</Label>
              <Input
                id="colors"
                name="colors"
                placeholder="Separe por virgula: Azul, Vermelho, Branco"
                value={colors}
                onChange={e => setColors(e.target.value)}
              />
              <p className="text-muted-foreground text-[10px]">
                Opcional. Liste as cores disponiveis.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="minQuantity">Alerta de Estoque Minimo</Label>
              <Input
                id="minQuantity"
                name="minQuantity"
                type="number"
                step="0.01"
                placeholder="Opcional"
                value={minQuantity}
                onChange={e => setMinQuantity(e.target.value)}
              />
              <p className="text-muted-foreground text-[10px]">
                Voce sera avisado quando o estoque estiver abaixo deste valor.
              </p>
              {localState.errors?.minQuantity && (
                <p className="text-xs text-red-500">{localState.errors.minQuantity[0]}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supplierId">Fornecedor Padrao</Label>
              <input type="hidden" name="supplierId" value={supplierId} />
              <Select
                value={supplierId || '__NONE__'}
                onValueChange={value => setSupplierId(value === '__NONE__' ? '' : value)}
              >
                <SelectTrigger id="supplierId">
                  <SelectValue placeholder="Selecione um fornecedor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">Sem fornecedor padrao</SelectItem>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {localState.message && !localState.success && !hasPossibleDuplicate && (
              <p className="text-sm text-red-500">{localState.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>

        <Dialog open={isDuplicateModalOpen} onOpenChange={setIsDuplicateModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Possivel material duplicado</DialogTitle>
              <DialogDescription>
                Encontramos material com nome parecido. Revise os dados antes de continuar.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {possibleDuplicates.map(candidate => (
                <div
                  key={candidate.id}
                  className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm"
                >
                  <p className="font-semibold text-slate-900">{candidate.name}</p>
                  <p className="text-slate-600">Unidade: {candidate.unit || '-'}</p>
                  <p className="text-amber-900">{candidate.reasons.join(', ')}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="sm:min-w-36"
                onClick={() => setIsDuplicateModalOpen(false)}
              >
                Revisar dados
              </Button>
              <Button
                type="submit"
                form={formId}
                name="forceDuplicate"
                value="1"
                className="sm:min-w-44"
                disabled={isPending}
              >
                Salvar mesmo assim
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
