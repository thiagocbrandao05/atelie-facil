'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createCustomer, updateCustomer } from '@/features/customers/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { ActionResponse, Customer } from '@/lib/types'

interface AddressParts {
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  stateCode: string
}

interface ViaCepResponse {
  erro?: boolean | 'true'
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
}

interface DuplicateCandidatePreview {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  birthday: string | null
  reasons: string[]
}

interface CustomerDuplicateActionData {
  duplicateType?: 'strict' | 'possible'
  canForce?: boolean
  candidates?: DuplicateCandidatePreview[]
}

const EMPTY_ADDRESS: AddressParts = {
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  stateCode: '',
}

function normalizeCep(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8)
}

function formatCep(value: string): string {
  const digits = normalizeCep(value)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function extractCepFromAddress(address?: string | null): string {
  if (!address) return ''
  const match = address.match(/\b\d{5}-?\d{3}\b/)
  return match ? formatCep(match[0]) : ''
}

function toDateInputValue(value?: string | Date | null): string {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
}

function parseAddress(address?: string | null): AddressParts {
  if (!address) return { ...EMPTY_ADDRESS }

  let parts = address
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  if (parts.length === 0) return { ...EMPTY_ADDRESS }
  parts = parts.filter(part => !/\b\d{5}-?\d{3}\b/.test(part))

  const parsed: AddressParts = {
    ...EMPTY_ADDRESS,
    street: parts[0] || '',
  }

  const lastPart = parts[parts.length - 1] || ''
  const cityStateMatch = lastPart.match(/^(.*)\s-\s([A-Za-z]{2})$/)
  let middle = parts.slice(1)

  if (cityStateMatch) {
    parsed.city = cityStateMatch[1]?.trim() || ''
    parsed.stateCode = cityStateMatch[2]?.trim().toUpperCase() || ''
    middle = parts.slice(1, -1)
  }

  if (middle.length > 0) {
    const first = middle[0] || ''
    if (/^\d+[A-Za-z0-9/-]*$/i.test(first) || /^s\/n$/i.test(first)) {
      parsed.number = first
      middle = middle.slice(1)
    }
  }

  if (middle.length > 0) parsed.neighborhood = middle[0] || ''
  if (middle.length > 1) parsed.complement = middle.slice(1).join(', ')

  return parsed
}

function composeAddress(parts: AddressParts, cepValue: string): string {
  const cityState =
    parts.city.trim() && parts.stateCode.trim()
      ? `${parts.city.trim()} - ${parts.stateCode.trim().toUpperCase()}`
      : parts.city.trim() || parts.stateCode.trim().toUpperCase()

  const values = [
    parts.street.trim(),
    parts.number.trim(),
    parts.complement.trim(),
    parts.neighborhood.trim(),
    cityState,
  ].filter(Boolean)

  const formattedCep = formatCep(cepValue)
  if (formattedCep) values.push(`CEP ${formattedCep}`)

  return values.join(', ')
}

export function CustomerForm({ customer }: { customer?: Customer }) {
  const initialAddress = parseAddress(customer?.address)

  const initialState: ActionResponse = { success: false, message: '' }
  const actionWithId = customer ? updateCustomer.bind(null, customer.id) : createCustomer
  const [state, action, isPending] = useActionState(actionWithId, initialState)

  const lastAutoLookupCepRef = useRef<string | null>(null)
  const activeLookupRequestRef = useRef(0)

  const [name, setName] = useState(customer?.name ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [email, setEmail] = useState(customer?.email ?? '')
  const [birthday, setBirthday] = useState(toDateInputValue(customer?.birthday ?? null))
  const [notes, setNotes] = useState(customer?.notes ?? '')

  const [cep, setCep] = useState(() => extractCepFromAddress(customer?.address))
  const [street, setStreet] = useState(initialAddress.street)
  const [number, setNumber] = useState(initialAddress.number)
  const [complement, setComplement] = useState(initialAddress.complement)
  const [neighborhood, setNeighborhood] = useState(initialAddress.neighborhood)
  const [city, setCity] = useState(initialAddress.city)
  const [stateCode, setStateCode] = useState(initialAddress.stateCode)

  const [showSuccess, setShowSuccess] = useState(false)
  const [cepFeedback, setCepFeedback] = useState<string | null>(null)
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)

  const errors = state?.errors
  const duplicateData = (state?.data as CustomerDuplicateActionData | undefined) ?? undefined
  const possibleDuplicates =
    !state?.success && duplicateData?.duplicateType === 'possible' && duplicateData?.canForce
      ? (duplicateData.candidates ?? [])
      : []
  const hasPossibleDuplicate = possibleDuplicates.length > 0

  useEffect(() => {
    const parsedAddress = parseAddress(customer?.address)

    setName(customer?.name ?? '')
    setPhone(customer?.phone ?? '')
    setEmail(customer?.email ?? '')
    setBirthday(toDateInputValue(customer?.birthday ?? null))
    setNotes(customer?.notes ?? '')

    setCep(extractCepFromAddress(customer?.address))
    setStreet(parsedAddress.street)
    setNumber(parsedAddress.number)
    setComplement(parsedAddress.complement)
    setNeighborhood(parsedAddress.neighborhood)
    setCity(parsedAddress.city)
    setStateCode(parsedAddress.stateCode)

    setCepFeedback(null)
    setIsDuplicateModalOpen(false)
    lastAutoLookupCepRef.current = null
    activeLookupRequestRef.current += 1
    setIsFetchingCep(false)
  }, [
    customer?.id,
    customer?.address,
    customer?.name,
    customer?.phone,
    customer?.email,
    customer?.birthday,
    customer?.notes,
  ])

  useEffect(() => {
    if (!state?.success) return

    setShowSuccess(true)
    setIsDuplicateModalOpen(false)

    if (!customer) {
      setName('')
      setPhone('')
      setEmail('')
      setBirthday('')
      setNotes('')

      setCep('')
      setStreet('')
      setNumber('')
      setComplement('')
      setNeighborhood('')
      setCity('')
      setStateCode('')

      setCepFeedback(null)
      lastAutoLookupCepRef.current = null
      activeLookupRequestRef.current += 1
      setIsFetchingCep(false)
    }

    const timer = setTimeout(() => setShowSuccess(false), 5000)
    return () => clearTimeout(timer)
  }, [state?.success, customer])

  useEffect(() => {
    const currentDuplicateData =
      (state?.data as CustomerDuplicateActionData | undefined) ?? undefined
    const shouldOpenDuplicateModal =
      !state?.success &&
      currentDuplicateData?.duplicateType === 'possible' &&
      currentDuplicateData?.canForce

    if (shouldOpenDuplicateModal) {
      setIsDuplicateModalOpen(true)
    }
  }, [state])

  const lookupCep = async (rawCep?: string) => {
    const digits = normalizeCep(rawCep ?? cep)
    if (digits.length !== 8) {
      setCepFeedback('Digite um CEP com 8 n\u00fameros para buscar.')
      return
    }

    const requestId = activeLookupRequestRef.current + 1
    activeLookupRequestRef.current = requestId

    try {
      setIsFetchingCep(true)
      setCepFeedback(null)

      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) throw new Error('Falha ao consultar CEP')

      const data = (await response.json()) as ViaCepResponse
      if (requestId !== activeLookupRequestRef.current) return

      if (data.erro === true || data.erro === 'true') {
        setCepFeedback('CEP n\u00e3o encontrado. Preencha o endere\u00e7o manualmente.')
        return
      }

      setCep(formatCep(digits))
      setStreet((data.logradouro || '').trim())
      setNeighborhood((data.bairro || '').trim())
      setCity((data.localidade || '').trim())
      setStateCode((data.uf || '').trim().toUpperCase())
      setCepFeedback('Endere\u00e7o preenchido automaticamente. Confira n\u00famero e complemento.')
    } catch (error) {
      if (requestId !== activeLookupRequestRef.current) return
      console.error('Erro ao consultar ViaCEP:', error)
      setCepFeedback('N\u00e3o foi poss\u00edvel consultar o CEP agora. Tente novamente.')
    } finally {
      if (requestId === activeLookupRequestRef.current) setIsFetchingCep(false)
    }
  }

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value)
    const digits = normalizeCep(formatted)

    setCep(formatted)
    if (cepFeedback) setCepFeedback(null)

    if (digits.length < 8) {
      lastAutoLookupCepRef.current = null
      return
    }

    if (digits !== lastAutoLookupCepRef.current) {
      lastAutoLookupCepRef.current = digits
      void lookupCep(digits)
    }
  }

  const addressValue = composeAddress(
    { street, number, complement, neighborhood, city, stateCode },
    cep
  )
  const formId = customer ? `customer-form-${customer.id}` : 'customer-form-new'

  return (
    <>
      <form id={formId} action={action} className="space-y-4">
        <input type="hidden" name="address" value={addressValue} />

        <div className="space-y-1.5">
          <Label
            htmlFor="name"
            className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
          >
            Nome Completo
          </Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Maria Silva"
            required
            className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
          />
          {errors?.name && (
            <p className="text-destructive pl-1 text-[10px] font-bold">{errors.name[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="phone"
              className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
            >
              Telefone / WhatsApp
            </Label>
            <Input
              id="phone"
              name="phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
            />
            {errors?.phone && (
              <p className="text-destructive pl-1 text-[10px] font-bold">{errors.phone[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
            >
              E-mail
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="maria@email.com"
              className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
            />
            {errors?.email && (
              <p className="text-destructive pl-1 text-[10px] font-bold">{errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="birthday"
              className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
            >
              {'Data de Anivers\u00e1rio'}
            </Label>
            <Input
              id="birthday"
              name="birthday"
              type="date"
              value={birthday}
              onChange={e => setBirthday(e.target.value)}
              className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
            />
            {errors?.birthday && (
              <p className="text-destructive pl-1 text-[10px] font-bold">{errors.birthday[0]}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase">
            {'Endere\u00e7o'}
          </Label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <Input
                id="cep"
                name="cep"
                value={cep}
                onChange={e => handleCepChange(e.target.value)}
                onBlur={e => {
                  const digits = normalizeCep(e.target.value)
                  if (digits.length === 8 && digits !== lastAutoLookupCepRef.current) {
                    lastAutoLookupCepRef.current = digits
                    void lookupCep(digits)
                  }
                }}
                placeholder="CEP (00000-000)"
                inputMode="numeric"
                autoComplete="postal-code"
                disabled={isFetchingCep}
                className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
              />
              {isFetchingCep ? (
                <p className="text-muted-foreground pt-1 pl-1 text-[10px]">Consultando CEP...</p>
              ) : (
                cepFeedback && (
                  <p className="text-muted-foreground pt-1 pl-1 text-[10px]">{cepFeedback}</p>
                )
              )}
            </div>

            <div className="md:col-span-4">
              <Input
                id="addressStreet"
                name="addressStreet"
                value={street}
                onChange={e => setStreet(e.target.value)}
                disabled={isFetchingCep}
                placeholder="Rua / Logradouro"
                className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
              />
            </div>

            <div className="md:col-span-2">
              <Input
                id="addressNumber"
                name="addressNumber"
                value={number}
                onChange={e => setNumber(e.target.value)}
                disabled={isFetchingCep}
                placeholder={'N\u00famero'}
                className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
              />
            </div>

            <div className="md:col-span-3">
              <Input
                id="addressComplement"
                name="addressComplement"
                value={complement}
                onChange={e => setComplement(e.target.value)}
                disabled={isFetchingCep}
                placeholder="Complemento"
                className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
              />
            </div>

            <div className="md:col-span-3">
              <Input
                id="addressNeighborhood"
                name="addressNeighborhood"
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                disabled={isFetchingCep}
                placeholder="Bairro"
                className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
              />
            </div>

            <div className="md:col-span-4">
              <Input
                id="addressCity"
                name="addressCity"
                value={city}
                onChange={e => setCity(e.target.value)}
                disabled={isFetchingCep}
                placeholder="Cidade"
                className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
              />
            </div>

            <div className="md:col-span-2">
              <Input
                id="addressState"
                name="addressState"
                value={stateCode}
                onChange={e => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
                disabled={isFetchingCep}
                placeholder="UF"
                maxLength={2}
                className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
              />
            </div>
          </div>

          {errors?.address && (
            <p className="text-destructive pl-1 text-[10px] font-bold">{errors.address[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="notes"
            className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
          >
            {'Observa\u00e7\u00f5es'}
          </Label>
          <Textarea
            id="notes"
            name="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={'Prefer\u00eancias, restri\u00e7\u00f5es, etc.'}
            className="focus:ring-primary/20 bg-muted/20 min-h-[80px] rounded-xl shadow-sm"
          />
          {errors?.notes && (
            <p className="text-destructive pl-1 text-[10px] font-bold">{errors.notes[0]}</p>
          )}
        </div>

        {!state?.success && state?.message && !hasPossibleDuplicate && (
          <p className="text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-xs font-semibold">
            {state.message}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            className="shadow-primary/20 h-11 w-full rounded-xl text-xs font-bold tracking-widest uppercase shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
            disabled={isPending || isFetchingCep}
          >
            {isFetchingCep
              ? 'Consultando CEP...'
              : isPending
                ? 'Salvando...'
                : customer
                  ? 'Salvar altera\u00e7\u00f5es'
                  : 'Cadastrar cliente'}
          </Button>
        </div>

        {showSuccess && state?.message && (
          <p className="text-success bg-success/10 animate-in fade-in slide-in-from-top-2 rounded-lg py-2 text-center text-xs font-bold duration-300">
            {state.message}
          </p>
        )}
      </form>

      <Dialog open={isDuplicateModalOpen} onOpenChange={setIsDuplicateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{'Poss\u00edvel cliente duplicado'}</DialogTitle>
            <DialogDescription>
              {'Encontramos poss\u00edvel cliente duplicado. Revise os dados antes de continuar.'}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {possibleDuplicates.map(candidate => (
              <div
                key={candidate.id}
                className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm"
              >
                <p className="font-semibold text-slate-900">{candidate.name}</p>
                <p className="text-slate-600">
                  {[candidate.phone || '', candidate.email || ''].filter(Boolean).join(' - ')}
                </p>
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
              disabled={isPending || isFetchingCep}
            >
              {customer ? 'Salvar mesmo assim' : 'Cadastrar mesmo assim'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
