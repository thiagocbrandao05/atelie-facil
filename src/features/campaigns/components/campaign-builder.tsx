'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createCampaign } from '../actions'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle } from 'lucide-react'

export function CampaignBuilder({
  customers,
  maxRecipients = 100,
  usage,
}: {
  customers: any[]
  maxRecipients?: number
  usage?: any
}) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggleCustomer = (id: string) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter(c => c !== id))
    } else {
      if (selectedCustomers.length >= maxRecipients) {
        toast.warning(`Limite de ${maxRecipients} destinatários atingido.`)
        return
      }
      setSelectedCustomers([...selectedCustomers, id])
    }
  }

  const toggleAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([])
    } else {
      const available = customers.slice(0, maxRecipients)
      if (available.length < customers.length) {
        toast.info(`Selecionando apenas os primeiros ${maxRecipients} clientes devido ao limite.`)
      }
      setSelectedCustomers(available.map(c => c.id))
    }
  }

  const handleSubmit = async () => {
    if (!name || !message || selectedCustomers.length === 0) {
      toast.error('Preencha todos os campos e selecione destinatários.')
      return
    }

    if (selectedCustomers.length > maxRecipients) {
      toast.error(
        `Limite excedido. Remova ${selectedCustomers.length - maxRecipients} destinatários.`
      )
      return
    }

    setLoading(true)
    try {
      const res = await createCampaign({
        name,
        messageText: message,
        imageUrl: imageUrl || undefined,
        recipientIds: selectedCustomers,
      })

      if (res.success) {
        toast.success('Campanha criada!')
        setName('')
        setMessage('')
        setSelectedCustomers([])
        setStep(1)
      } else {
        toast.error(res.message)
      }
    } catch (e) {
      toast.error('Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>1. Configuração da Campanha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Campanha</Label>
            <Input
              placeholder="Ex: Promoção Dia das Mães"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              placeholder="Olá {cliente}, confira nossas novidades..."
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Use <strong>{'{cliente}'}</strong> para o nome e <strong>{'{link}'}</strong> para o
              link da campanha.
            </p>
          </div>
          <div className="space-y-2">
            <Label>URL da Imagem (Opcional)</Label>
            <Input
              placeholder="https://..."
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            2. Destinatários
            <div className="text-muted-foreground text-sm font-normal">
              {selectedCustomers.length} / {maxRecipients}
            </div>
          </CardTitle>
          <CardDescription>Quem receberá esta mensagem?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            <Progress value={(selectedCustomers.length / maxRecipients) * 100} className="h-2" />

            <div className="flex items-center space-x-2 border-b py-2">
              <Checkbox
                checked={customers.length > 0 && selectedCustomers.length === customers.length}
                onCheckedChange={toggleAll}
              />
              <Label>Selecionar Todos (Máx {maxRecipients})</Label>
            </div>
          </div>
          <div className="h-[250px] space-y-2 overflow-y-auto">
            {customers.map(customer => (
              <div
                key={customer.id}
                className="hover:bg-secondary/20 flex items-center space-x-2 rounded p-1"
              >
                <Checkbox
                  id={customer.id}
                  checked={selectedCustomers.includes(customer.id)}
                  onCheckedChange={() => toggleCustomer(customer.id)}
                />
                <Label htmlFor={customer.id} className="flex-1 cursor-pointer">
                  {customer.name}
                  <span className="text-muted-foreground ml-2 text-xs">
                    ({customer.phone || 'Sem fone'})
                  </span>
                </Label>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4">
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={loading || selectedCustomers.length === 0}
            >
              {loading ? 'Criando...' : 'Salvar Campanha'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
