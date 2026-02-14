'use client'

import { useActionState, useState, useEffect, useMemo } from 'react'
import { updateSettings } from '@/features/settings/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Store,
  DollarSign,
  MessageSquare,
  Palette,
  Save,
  Database,
  Mail,
  Instagram,
  Facebook,
  MapPin,
  FileText,
  Calendar,
  Plus,
  Trash2,
  Info,
  TrendingUp,
  Upload,
  Sparkles,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { DEFAULT_THEME, THEME_OPTIONS, resolveThemeKey } from '@/lib/theme-tokens'

import { Skeleton } from '@/components/ui/skeleton'

const BackupManager = dynamic(
  () => import('@/components/backup-manager').then(mod => mod.BackupManager),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-xl" />,
  }
)

const BulkImport = dynamic(() => import('@/components/bulk-import').then(mod => mod.BulkImport), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-xl" />,
})

const WhatsAppSettingsTab = dynamic(
  () => import('@/components/whatsapp-settings-tab').then(mod => mod.WhatsAppSettingsTab),
  {
    ssr: false,
    loading: () => <div className="space-y-4">
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <Skeleton className="h-[100px] w-full rounded-xl" />
    </div>,
  }
)

const initialState = { success: false, message: '' }

interface FixedCostItem {
  id: string
  label: string
  value: number
}

export function SettingsForm({
  settings,
  whatsappUsage,
  workspaceSlug,
}: {
  settings: any
  whatsappUsage?: any
  workspaceSlug: string
}) {
  const [state, action, isPending] = useActionState(updateSettings, initialState)
  const [activeTab, setActiveTab] = useState('general')

  // Financial Calculator State
  const [fixedCosts, setFixedCosts] = useState<FixedCostItem[]>(
    settings.monthlyFixedCosts?.length > 0
      ? settings.monthlyFixedCosts.map((c: any, i: number) => ({ ...c, id: `cost-${i}` }))
      : []
  )
  const [desirableSalary, setDesirableSalary] = useState(Number(settings.desirableSalary) || 2000)
  const [workingHours, setWorkingHours] = useState(Number(settings.workingHoursPerMonth) || 160)

  // New item for fixed costs
  const [newCostLabel, setNewCostLabel] = useState('')
  const [newCostValue, setNewCostValue] = useState('')

  const addFixedCost = () => {
    if (!newCostLabel || !newCostValue) return
    const val = parseFloat(newCostValue)
    if (isNaN(val)) return

    setFixedCosts([
      ...fixedCosts,
      {
        id: `cost-${Date.now()}`,
        label: newCostLabel,
        value: val,
      },
    ])
    setNewCostLabel('')
    setNewCostValue('')
  }

  const removeFixedCost = (id: string) => {
    setFixedCosts(fixedCosts.filter(c => c.id !== id))
  }

  const totalFixedCosts = useMemo(
    () => fixedCosts.reduce((sum, c) => sum + c.value, 0),
    [fixedCosts]
  )

  const calculatedHourlyRate = useMemo(() => {
    if (workingHours <= 0) return 0
    return (desirableSalary + totalFixedCosts) / workingHours
  }, [desirableSalary, totalFixedCosts, workingHours])

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success(state.message)
      } else {
        toast.error(state.message)
      }
    }
  }, [state])

  const isMainTab = ['general', 'financial', 'notifications', 'appearance'].includes(activeTab)

  return (
    <Tabs
      defaultValue="general"
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-4"
    >
      <TabsList className="bg-background h-auto flex-wrap border p-1">
        <TabsTrigger value="general" className="shrink-0 gap-2">
          <Store size={16} /> Geral
        </TabsTrigger>
        <TabsTrigger value="financial" className="shrink-0 gap-2">
          <TrendingUp size={16} /> Financeiro
        </TabsTrigger>
        <TabsTrigger value="notifications" className="shrink-0 gap-2">
          <MessageSquare size={16} /> Mensagens
        </TabsTrigger>
        <TabsTrigger value="appearance" className="shrink-0 gap-2">
          <Palette size={16} /> Aparência
        </TabsTrigger>
        <TabsTrigger value="maintenance" className="shrink-0 gap-2">
          <Database size={16} /> Sistema
        </TabsTrigger>
        <TabsTrigger value="bulk-import" className="shrink-0 gap-2">
          <Upload size={16} /> Carga em Lote
        </TabsTrigger>
        <TabsTrigger value="whatsapp" className="shrink-0 gap-2">
          <MessageSquare size={16} /> WhatsApp / API
        </TabsTrigger>
        <TabsTrigger value="subscription" className="text-primary shrink-0 gap-2 font-bold">
          <Sparkles size={16} className="fill-primary/20" /> Assinatura
        </TabsTrigger>
      </TabsList>

      {/* Main Settings Form */}
      <form action={action}>
        <input
          type="hidden"
          name="monthlyFixedCosts"
          value={JSON.stringify(fixedCosts.map(({ label, value }) => ({ label, value })))}
        />
        <input type="hidden" name="hourlyRate" value={calculatedHourlyRate.toFixed(2)} />

        {/* Geral */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Identity section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store size={18} className="text-primary" /> Identidade do Ateliê
                </CardTitle>
                <CardDescription>Como sua marca aparece para os clientes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="flex-grow space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="storeName">Nome da Loja</Label>
                      <Input
                        id="storeName"
                        name="storeName"
                        defaultValue={settings.storeName}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="logoUrl">URL da Logo</Label>
                      <Input
                        id="logoUrl"
                        name="logoUrl"
                        defaultValue={settings.logoUrl || ''}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="shrink-0 space-y-2">
                    <Label className="text-muted-foreground text-xs font-bold uppercase">
                      Preview Logo
                    </Label>
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border bg-white">
                      {settings.logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={settings.logoUrl}
                          alt="Logo"
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <Store size={32} className="opacity-10" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail size={18} className="text-primary" /> Contato & Redes
                </CardTitle>
                <CardDescription>Canais de atendimento ao cliente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Instagram size={14} /> WhatsApp
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={settings.phone || ''}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail size={14} /> Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={settings.email || ''}
                    placeholder="atendimento@seuatelie.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <Instagram size={14} /> Instagram
                    </Label>
                    <Input
                      id="instagram"
                      name="instagram"
                      defaultValue={settings.instagram || ''}
                      placeholder="@seuatelie"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="facebook" className="flex items-center gap-2">
                      <Facebook size={14} /> Facebook
                    </Label>
                    <Input
                      id="facebook"
                      name="facebook"
                      defaultValue={settings.facebook || ''}
                      placeholder="facebook.com/seuatelie"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address section */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin size={18} className="text-primary" /> Endereço do Ateliê
                </CardTitle>
                <CardDescription>
                  Opcional. Usado no cabeçalho de orçamentos e impressões.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="grid gap-2 md:col-span-3">
                    <Label htmlFor="addressStreet">Rua/Logradouro</Label>
                    <Input
                      id="addressStreet"
                      name="addressStreet"
                      defaultValue={settings.addressStreet || ''}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="addressNumber">Número</Label>
                    <Input
                      id="addressNumber"
                      name="addressNumber"
                      defaultValue={settings.addressNumber || ''}
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="addressComplement">Complemento</Label>
                    <Input
                      id="addressComplement"
                      name="addressComplement"
                      defaultValue={settings.addressComplement || ''}
                      placeholder="Apto, Sala, etc."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="addressNeighborhood">Bairro</Label>
                    <Input
                      id="addressNeighborhood"
                      name="addressNeighborhood"
                      defaultValue={settings.addressNeighborhood || ''}
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="addressCity">Cidade</Label>
                    <Input
                      id="addressCity"
                      name="addressCity"
                      defaultValue={settings.addressCity || ''}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="addressState">Estado (UF)</Label>
                    <Input
                      id="addressState"
                      name="addressState"
                      defaultValue={settings.addressState || ''}
                      maxLength={2}
                      placeholder="SP"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="addressZip">CEP</Label>
                    <Input
                      id="addressZip"
                      name="addressZip"
                      defaultValue={settings.addressZip || ''}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Preferences */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={18} className="text-primary" /> Preferências de Orçamento
                </CardTitle>
                <CardDescription>Configure como seus orçamentos são apresentados.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="quotationValidityDays" className="flex items-center gap-2">
                    <Calendar size={14} /> Validade padrão (dias)
                  </Label>
                  <Input
                    id="quotationValidityDays"
                    name="quotationValidityDays"
                    type="number"
                    defaultValue={settings.quotationValidityDays || 15}
                  />
                  <p className="text-muted-foreground text-[10px]">
                    Tempo até o orçamento expirar.
                  </p>
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="defaultQuotationNotes">Observações Padrão</Label>
                  <Textarea
                    id="defaultQuotationNotes"
                    name="defaultQuotationNotes"
                    placeholder="Ex: Pagamento 50% na aprovação e 50% na entrega..."
                    className="h-20"
                    defaultValue={settings.defaultQuotationNotes || ''}
                  />
                  <p className="text-muted-foreground text-[10px]">
                    Texto que aparece no rodapé de todos os novos orçamentos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financeiro */}
        <TabsContent value="financial" className="space-y-4">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary" /> Precificação para Artesãos
                  </CardTitle>
                  <CardDescription>
                    Calcule seu valor por hora de forma justa e profissional.
                  </CardDescription>
                </div>
                <div className="bg-primary text-primary-foreground rounded-xl p-3 text-center shadow-lg">
                  <p className="text-[10px] font-bold uppercase opacity-80">Valor/Hora Calculado</p>
                  <p className="text-2xl font-black">R$ {calculatedHourlyRate.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Left Column: Salary & Hours */}
                <div className="space-y-6">
                  <div className="grid gap-3">
                    <Label
                      htmlFor="desirableSalary"
                      className="flex items-center gap-2 text-lg font-semibold"
                    >
                      1. Salário Desejado (Pró-labore)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info size={14} className="text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Quanto você quer tirar livre para você todo mês.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <div className="relative">
                      <span className="text-muted-foreground absolute top-2.5 left-3">R$</span>
                      <Input
                        id="desirableSalary"
                        name="desirableSalary"
                        type="number"
                        value={desirableSalary}
                        onChange={e => setDesirableSalary(Number(e.target.value) || 0)}
                        className="h-12 pl-9 text-lg font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Label
                      htmlFor="workingHoursPerMonth"
                      className="flex items-center gap-2 text-lg font-semibold"
                    >
                      2. Horas de Trabalho Mensais
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="workingHoursPerMonth"
                        name="workingHoursPerMonth"
                        type="number"
                        value={workingHours}
                        onChange={e => setWorkingHours(Number(e.target.value) || 0)}
                        className="h-12 w-32 text-lg font-bold"
                      />
                      <span className="text-muted-foreground">horas por mês</span>
                    </div>
                    <p className="text-muted-foreground text-xs italic">
                      Ex: 8h por dia, 20 dias por mês = 160h
                    </p>
                  </div>

                  <Separator />

                  <div className="grid gap-3">
                    <Label
                      htmlFor="defaultProfitMargin"
                      className="flex items-center gap-2 text-lg font-semibold"
                    >
                      Margem de Lucro Padrão (%)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info size={14} className="text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Margem para reinvestimento e crescimento (além do seu salário).
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="defaultProfitMargin"
                        name="defaultProfitMargin"
                        type="number"
                        defaultValue={settings.defaultProfitMargin || 50}
                        className="h-12 w-32 text-lg font-bold"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <Separator className="my-2" />
                  <div className="space-y-4 pt-4">
                    <Label className="flex items-center gap-2 text-lg font-black tracking-tight uppercase text-primary/80">
                      <TrendingUp size={18} className="text-primary" /> Configurações de Inteligência Financeira
                    </Label>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="grid gap-2">
                        <Label htmlFor="taxRate" className="font-semibold text-xs uppercase opacity-70">Impostos / Venda (%)</Label>
                        <Input
                          id="taxRate"
                          name="taxRate"
                          type="number"
                          step="0.01"
                          defaultValue={settings.taxRate || 0}
                          className="h-10 font-bold"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cardFeeRate" className="font-semibold text-xs uppercase opacity-70">Taxas de Cartão (%)</Label>
                        <Input
                          id="cardFeeRate"
                          name="cardFeeRate"
                          type="number"
                          step="0.01"
                          defaultValue={settings.cardFeeRate || 0}
                          className="h-10 font-bold"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="targetMonthlyProfit" className="font-semibold text-xs uppercase opacity-70">Meta de Lucro Livre (R$)</Label>
                        <Input
                          id="targetMonthlyProfit"
                          name="targetMonthlyProfit"
                          type="number"
                          defaultValue={settings.targetMonthlyProfit || 0}
                          className="h-10 font-bold"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="psychologicalPricingPattern" className="font-semibold text-xs uppercase opacity-70">Arredondamento</Label>
                        <Select name="psychologicalPricingPattern" defaultValue={settings.psychologicalPricingPattern || '90'}>
                          <SelectTrigger className="h-10 font-bold">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="90">.90 (Ex: 19,90)</SelectItem>
                            <SelectItem value="99">.99 (Ex: 19,99)</SelectItem>
                            <SelectItem value="97">.97 (Ex: 19,97)</SelectItem>
                            <SelectItem value="round">Arredondar</SelectItem>
                            <SelectItem value="none">Nenhum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="space-y-4 pt-2">
                      <Label className="flex items-center gap-2 text-lg font-black tracking-tight uppercase text-primary/80">
                        <Sparkles size={18} className="text-primary" /> Experiência de Uso (UX Financeira)
                      </Label>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        Como você prefere ver as informações de lucro e rentabilidade?
                      </p>

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="financialDisplayMode" className="font-semibold text-xs uppercase opacity-70">Modo de Exibição</Label>
                          <Select name="financialDisplayMode" defaultValue={settings.financialDisplayMode || 'simple'}>
                            <SelectTrigger className="h-10 font-bold border-primary/20">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="simple">
                                <div className="flex flex-col text-left">
                                  <span className="font-bold text-primary">Modo Humano (Iniciante)</span>
                                  <span className="text-[10px] opacity-60">Linguagem clara, cores e alertas diretos. Ideal p/ artesãos.</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="advanced">
                                <div className="flex flex-col text-left">
                                  <span className="font-bold">Modo Premium (Técnico)</span>
                                  <span className="text-[10px] opacity-60">Exibe MC, BEP e dados brutos. Para empreendedores experientes.</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="marginThresholdWarning" className="font-semibold text-[10px] uppercase opacity-70 flex items-center gap-1">
                              Atenção 🟡 (%)
                            </Label>
                            <Input
                              id="marginThresholdWarning"
                              name="marginThresholdWarning"
                              type="number"
                              defaultValue={settings.marginThresholdWarning ?? 20}
                              className="h-10 font-bold border-yellow-500/20"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="marginThresholdOptimal" className="font-semibold text-[10px] uppercase opacity-70 flex items-center gap-1">
                              Saudável 🟢 (%)
                            </Label>
                            <Input
                              id="marginThresholdOptimal"
                              name="marginThresholdOptimal"
                              type="number"
                              defaultValue={settings.marginThresholdOptimal ?? 40}
                              className="h-10 font-bold border-green-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Fixed Costs */}
                <div className="bg-muted/30 space-y-4 rounded-2xl border border-dashed p-6">
                  <Label className="flex items-center gap-2 text-lg font-semibold">
                    3. Custos Fixos do Ateliê
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info size={14} className="text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Despesas que você tem independente de vender ou não (Luz, Internet,
                          Aluguel, MEI).
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>

                  <div className="space-y-3">
                    {fixedCosts.map(cost => (
                      <div
                        key={cost.id}
                        className="bg-background group flex items-center justify-between rounded-lg border p-3 shadow-sm"
                      >
                        <span className="font-medium">{cost.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold">R$ {cost.value.toFixed(2)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => removeFixedCost(cost.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <div className="grid flex-grow gap-1">
                      <Input
                        placeholder="Ex: Internet"
                        value={newCostLabel}
                        onChange={e => setNewCostLabel(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="grid w-24 gap-1">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newCostValue}
                        onChange={e => setNewCostValue(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      onClick={addFixedCost}
                      className="h-9 w-9 shrink-0"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-4 text-sm">
                    <span className="text-muted-foreground font-medium">
                      Total de Custos Fixos:
                    </span>
                    <span className="text-lg font-black tracking-tight">
                      R$ {totalFixedCosts.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificações / Mensagens */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" /> Modelos de Mensagem (WhatsApp)
              </CardTitle>
              <CardDescription>Personalize as mensagens para cada etapa do pedido.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="msgQuotation">1. Envio de Orçamento</Label>
                <Textarea
                  id="msgQuotation"
                  name="msgQuotation"
                  className="min-h-[80px]"
                  defaultValue={
                    settings.msgQuotation ||
                    'Olá {cliente}, aqui está o orçamento dos seus produtos...'
                  }
                />
                <p className="text-muted-foreground text-[10px]">
                  Tags: {'{cliente}'}, {'{valor}'}, {'{itens}'}, {'{link_publico}'}
                </p>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="msgApproved">2. Pedido Aprovado / Produção Iniciada</Label>
                <Textarea
                  id="msgApproved"
                  name="msgApproved"
                  className="min-h-[80px]"
                  defaultValue={
                    settings.msgApproved ||
                    'Olá {cliente}, seu pedido foi aprovado e iniciamos a produção!'
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="msgReady">3. Pedido Pronto para Entrega</Label>
                <Textarea
                  id="msgReady"
                  name="msgReady"
                  className="min-h-[80px]"
                  defaultValue={
                    settings.msgReady || 'Olá {cliente}, boas notícias! Seu pedido está prontinho.'
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="msgFinished">4. Agradecimento Pós-Entrega</Label>
                <Textarea
                  id="msgFinished"
                  name="msgFinished"
                  className="min-h-[80px]"
                  defaultValue={
                    settings.msgFinished ||
                    'Olá {cliente}, muito obrigado por sua compra! Espero que tenha gostado.'
                  }
                />
              </div>

              <Separator />

            </CardContent>
          </Card>
        </TabsContent>

        {/* Aparência */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette size={18} className="text-primary" /> Personalização Visual
              </CardTitle>
              <CardDescription>Escolha o tema de cores do sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Label>Tema do sistema</Label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {THEME_OPTIONS.map(theme => {
                    const isSelected = resolveThemeKey(settings.primaryColor) === theme.key
                    return (
                      <label key={theme.key} className="cursor-pointer">
                        <input
                          type="radio"
                          name="primaryColor"
                          value={theme.key}
                          defaultChecked={isSelected}
                          className="peer sr-only"
                        />
                        <div className="bg-background peer-checked:border-primary peer-checked:ring-primary/30 hover:border-primary/40 rounded-2xl border p-4 transition-all peer-checked:ring-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-foreground text-sm font-semibold">{theme.name}</p>
                              <p className="text-muted-foreground mt-1 text-xs">
                                {theme.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {Object.entries(theme.colors).map(([key, color]) => (
                                <span
                                  key={key}
                                  className="border-border h-4 w-4 rounded-full border"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="border-border/60 bg-muted/30 mt-4 rounded-xl border p-3">
                            <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                              <span>Preview</span>
                              <span className="text-foreground font-medium">Atelis</span>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <div
                                className="h-8 rounded-lg"
                                style={{ backgroundColor: theme.colors.primary }}
                              />
                              <div
                                className="h-8 rounded-lg"
                                style={{ backgroundColor: theme.colors.accent }}
                              />
                              <div
                                className="h-8 rounded-lg"
                                style={{ backgroundColor: theme.colors.border }}
                              />
                            </div>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions - Only visible for main tabs */}
        {isMainTab && (
          <div className="sticky bottom-4 z-10 flex flex-col items-end gap-2 pt-4 transition-all duration-300">
            <Button type="submit" size="lg" className="shadow-xl" disabled={isPending}>
              <Save className="mr-2 h-5 w-5" />{' '}
              {isPending ? 'Salvando...' : 'Salvar Todas as Configurações'}
            </Button>
          </div>
        )}
      </form>

      {/* Manutenção / Sistema */}
      <TabsContent value="maintenance">
        <BackupManager />
      </TabsContent>

      {/* Carga em Lote */}
      <TabsContent value="bulk-import">
        <BulkImport />
      </TabsContent>

      <TabsContent value="whatsapp">
        <WhatsAppSettingsTab
          settings={settings}
          usageSummary={whatsappUsage}
          workspaceSlug={workspaceSlug}
        />
      </TabsContent>
      <TabsContent value="subscription">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles size={20} className="text-primary fill-primary/20" /> Gerenciar Assinatura
            </CardTitle>
            <CardDescription>Visualize seu plano atual e descubra novos recursos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4 rounded-2xl border bg-white p-6 text-center shadow-sm">
              <div className="bg-primary/10 text-primary rounded-full p-4">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-xl font-bold">Quer levar seu ateliê para o próximo nível?</h3>
              <p className="text-muted-foreground max-w-sm">
                Desbloqueie automações inteligentes, maior limite de mensagens e gestão avançada de
                pedidos.
              </p>
              <Button asChild size="lg" className="w-full font-bold sm:w-auto">
                <Link href={`/${workspaceSlug}/app/upgrade`}>Ver Opções de Upgrade →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
