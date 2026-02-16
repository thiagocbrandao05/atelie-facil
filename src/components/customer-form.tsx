'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createCustomer, updateCustomer } from '@/features/customers/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { ActionResponse, Customer } from '@/lib/types'

export function CustomerForm({ customer }: { customer?: Customer }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [cep, setCep] = useState('')
  const [address, setAddress] = useState(customer?.address || '')
  const [cepFeedback, setCepFeedback] = useState<string | null>(null)
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const initialState: ActionResponse = { success: false, message: '' }
  const actionWithId = customer ? updateCustomer.bind(null, customer.id) : createCustomer
  const [state, action, isPending] = useActionState(actionWithId, initialState)
  const errors = state?.errors

  useEffect(() => {
    setAddress(customer?.address || '')
  }, [customer?.id, customer?.address])

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true)
      if (!customer) {
        formRef.current?.reset()
        setAddress('')
        setCep('')
        setCepFeedback(null)
      }
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [state?.success, customer])

  const normalizeCep = (value: string) => value.replace(/\D/g, '').slice(0, 8)

  const formatCep = (value: string) => {
    const digits = normalizeCep(value)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  const handleCepChange = (value: string) => {
    setCep(formatCep(value))
    if (cepFeedback) setCepFeedback(null)
  }

  const lookupCep = async (rawCep?: string) => {
    const digits = normalizeCep(rawCep ?? cep)
    if (digits.length !== 8) {
      setCepFeedback('Digite um CEP com 8 números para buscar.')
      return
    }

    try {
      setIsFetchingCep(true)
      setCepFeedback(null)

      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Falha ao consultar CEP')
      }

      const data = (await response.json()) as {
        erro?: boolean
        logradouro?: string
        bairro?: string
        localidade?: string
        uf?: string
      }

      if (data.erro) {
        setCepFeedback('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }

      const cityUf = [data.localidade, data.uf].filter(Boolean).join(' - ')
      const composedAddress = [data.logradouro, data.bairro, cityUf].filter(Boolean).join(', ')

      if (!composedAddress) {
        setCepFeedback('CEP encontrado, mas sem detalhes completos de endereço.')
        return
      }

      setCep(formatCep(digits))
      setAddress(composedAddress)
      setCepFeedback('Endereço preenchido automaticamente. Confira número e complemento.')
    } catch (error) {
      console.error('Erro ao consultar ViaCEP:', error)
      setCepFeedback('Não foi possível consultar o CEP agora. Tente novamente.')
    } finally {
      setIsFetchingCep(false)
    }
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
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
          defaultValue={customer?.name}
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
            defaultValue={customer?.phone || ''}
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
            defaultValue={customer?.email || ''}
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
            Data de Aniversário
          </Label>
          <Input
            id="birthday"
            name="birthday"
            type="date"
            defaultValue={
              customer?.birthday ? new Date(customer.birthday).toISOString().split('T')[0] : ''
            }
            className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
          />
          {errors?.birthday && (
            <p className="text-destructive pl-1 text-[10px] font-bold">{errors.birthday[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="cep"
            className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
          >
            CEP
          </Label>
          <div className="flex gap-2">
            <Input
              id="cep"
              name="cep"
              value={cep}
              onChange={e => handleCepChange(e.target.value)}
              onBlur={e => {
                void lookupCep(e.target.value)
              }}
              placeholder="00000-000"
              inputMode="numeric"
              autoComplete="postal-code"
              className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
            />
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 rounded-xl px-3 text-[11px] font-bold"
              onClick={() => {
                void lookupCep()
              }}
              disabled={isFetchingCep}
            >
              {isFetchingCep ? 'Buscando...' : 'Buscar CEP'}
            </Button>
          </div>
          {cepFeedback && <p className="text-muted-foreground pl-1 text-[10px]">{cepFeedback}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="address"
          className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
        >
          Endereço
        </Label>
        <Input
          id="address"
          name="address"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Rua, número, bairro..."
          className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
        />
        {errors?.address && (
          <p className="text-destructive pl-1 text-[10px] font-bold">{errors.address[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="notes"
          className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
        >
          Observações
        </Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={customer?.notes || ''}
          placeholder="Preferências, restrições, etc."
          className="focus:ring-primary/20 bg-muted/20 min-h-[80px] rounded-xl shadow-sm"
        />
        {errors?.notes && (
          <p className="text-destructive pl-1 text-[10px] font-bold">{errors.notes[0]}</p>
        )}
      </div>

      <Button
        type="submit"
        className="shadow-primary/20 h-11 w-full rounded-xl text-xs font-bold tracking-widest uppercase shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
        disabled={isPending}
      >
        {isPending ? 'Salvando...' : customer ? 'Atualizar Cliente' : 'Salvar Cliente'}
      </Button>

      {showSuccess && state?.message && (
        <p className="text-success bg-success/10 animate-in fade-in slide-in-from-top-2 rounded-lg py-2 text-center text-xs font-bold duration-300">
          {state.message}
        </p>
      )}
    </form>
  )
}
