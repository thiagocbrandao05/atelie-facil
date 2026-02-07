"use client"

import { useActionState, useState, useEffect, useMemo } from "react"
import { updateSettings } from "@/features/settings/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Store, DollarSign, MessageSquare, Palette, Save,
    Database, Mail, Instagram, Facebook, MapPin,
    FileText, Calendar, Plus, Trash2, Info, TrendingUp, Upload
} from "lucide-react"
import dynamic from 'next/dynamic'
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

const BackupManager = dynamic(() => import('@/components/backup-manager').then(mod => mod.BackupManager), {
    ssr: false,
    loading: () => <p>Carregando ferramenta de backup...</p>
})

const BulkImport = dynamic(() => import('@/components/bulk-import').then(mod => mod.BulkImport), {
    ssr: false,
    loading: () => <p>Carregando ferramenta de importação...</p>
})

const initialState = { success: false, message: '' }

interface FixedCostItem {
    id: string
    label: string
    value: number
}

export function SettingsForm({ settings }: { settings: any }) {
    const [state, action, isPending] = useActionState(updateSettings, initialState)

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

        setFixedCosts([...fixedCosts, {
            id: `cost-${Date.now()}`,
            label: newCostLabel,
            value: val
        }])
        setNewCostLabel('')
        setNewCostValue('')
    }

    const removeFixedCost = (id: string) => {
        setFixedCosts(fixedCosts.filter(c => c.id !== id))
    }

    const totalFixedCosts = useMemo(() =>
        fixedCosts.reduce((sum, c) => sum + c.value, 0),
        [fixedCosts])

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

    return (
        <form action={action}>
            <input type="hidden" name="monthlyFixedCosts" value={JSON.stringify(fixedCosts.map(({ label, value }) => ({ label, value })))} />
            <input type="hidden" name="hourlyRate" value={calculatedHourlyRate.toFixed(2)} />

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="bg-background border h-auto flex-wrap p-1">
                    <TabsTrigger value="general" className="gap-2 shrink-0">
                        <Store size={16} /> Geral
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="gap-2 shrink-0">
                        <TrendingUp size={16} /> Financeiro
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2 shrink-0">
                        <MessageSquare size={16} /> Mensagens
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="gap-2 shrink-0">
                        <Palette size={16} /> Aparência
                    </TabsTrigger>
                    <TabsTrigger value="maintenance" className="gap-2 shrink-0">
                        <Database size={16} /> Sistema
                    </TabsTrigger>
                    <TabsTrigger value="bulk-import" className="gap-2 shrink-0">
                        <Upload size={16} /> Carga em Lote
                    </TabsTrigger>
                </TabsList>

                {/* Geral */}
                <TabsContent value="general" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Identity section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Store size={18} className="text-primary" /> Identidade do Ateliê
                                </CardTitle>
                                <CardDescription>Como sua marca aparece para os clientes.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="space-y-4 flex-grow">
                                        <div className="grid gap-2">
                                            <Label htmlFor="storeName">Nome da Loja</Label>
                                            <Input id="storeName" name="storeName" defaultValue={settings.storeName} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="logoUrl">URL da Logo</Label>
                                            <Input id="logoUrl" name="logoUrl" defaultValue={settings.logoUrl || ""} placeholder="https://..." />
                                        </div>
                                    </div>
                                    <div className="shrink-0 space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase font-bold">Preview Logo</Label>
                                        <div className="w-24 h-24 rounded-lg border bg-white flex items-center justify-center overflow-hidden">
                                            {settings.logoUrl ? (
                                                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
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
                                    <Label htmlFor="phone" className="flex items-center gap-2"><Instagram size={14} /> WhatsApp</Label>
                                    <Input id="phone" name="phone" defaultValue={settings.phone || ""} placeholder="(00) 00000-0000" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="flex items-center gap-2"><Mail size={14} /> Email</Label>
                                    <Input id="email" name="email" type="email" defaultValue={settings.email || ""} placeholder="atendimento@seuatelie.com" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="instagram" className="flex items-center gap-2"><Instagram size={14} /> Instagram</Label>
                                        <Input id="instagram" name="instagram" defaultValue={settings.instagram || ""} placeholder="@seuatelie" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="facebook" className="flex items-center gap-2"><Facebook size={14} /> Facebook</Label>
                                        <Input id="facebook" name="facebook" defaultValue={settings.facebook || ""} placeholder="facebook.com/seuatelie" />
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
                                <CardDescription>Opcional. Usado no cabeçalho de orçamentos e impressões.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-3 grid gap-2">
                                        <Label htmlFor="addressStreet">Rua/Logradouro</Label>
                                        <Input id="addressStreet" name="addressStreet" defaultValue={settings.addressStreet || ""} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="addressNumber">Número</Label>
                                        <Input id="addressNumber" name="addressNumber" defaultValue={settings.addressNumber || ""} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="addressComplement">Complemento</Label>
                                        <Input id="addressComplement" name="addressComplement" defaultValue={settings.addressComplement || ""} placeholder="Apto, Sala, etc." />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="addressNeighborhood">Bairro</Label>
                                        <Input id="addressNeighborhood" name="addressNeighborhood" defaultValue={settings.addressNeighborhood || ""} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="addressCity">Cidade</Label>
                                        <Input id="addressCity" name="addressCity" defaultValue={settings.addressCity || ""} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="addressState">Estado (UF)</Label>
                                        <Input id="addressState" name="addressState" defaultValue={settings.addressState || ""} maxLength={2} placeholder="SP" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="addressZip">CEP</Label>
                                        <Input id="addressZip" name="addressZip" defaultValue={settings.addressZip || ""} placeholder="00000-000" />
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
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                    <p className="text-[10px] text-muted-foreground">Tempo até o orçamento expirar.</p>
                                </div>
                                <div className="md:col-span-2 grid gap-2">
                                    <Label htmlFor="defaultQuotationNotes">Observações Padrão</Label>
                                    <Textarea
                                        id="defaultQuotationNotes"
                                        name="defaultQuotationNotes"
                                        placeholder="Ex: Pagamento 50% na aprovação e 50% na entrega..."
                                        className="h-20"
                                        defaultValue={settings.defaultQuotationNotes || ""}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Texto que aparece no rodapé de todos os novos orçamentos.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Financeiro */}
                <TabsContent value="financial" className="space-y-4">
                    <Card className="border-primary/20 shadow-md">
                        <CardHeader className="bg-primary/5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp size={20} className="text-primary" /> Precificação para Artesãos
                                    </CardTitle>
                                    <CardDescription>Calcule seu valor por hora de forma justa e profissional.</CardDescription>
                                </div>
                                <div className="bg-primary text-primary-foreground p-3 rounded-xl text-center shadow-lg">
                                    <p className="text-[10px] uppercase font-bold opacity-80">Valor/Hora Calculado</p>
                                    <p className="text-2xl font-black">R$ {calculatedHourlyRate.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Column: Salary & Hours */}
                                <div className="space-y-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="desirableSalary" className="text-lg font-semibold flex items-center gap-2">
                                            1. Salário Desejado (Pró-labore)
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info size={14} className="text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Quanto você quer tirar livre para você todo mês.</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                                            <Input
                                                id="desirableSalary"
                                                name="desirableSalary"
                                                type="number"
                                                value={desirableSalary}
                                                onChange={e => setDesirableSalary(Number(e.target.value))}
                                                className="pl-9 h-12 text-lg font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="workingHoursPerMonth" className="text-lg font-semibold flex items-center gap-2">
                                            2. Horas de Trabalho Mensais
                                        </Label>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                id="workingHoursPerMonth"
                                                name="workingHoursPerMonth"
                                                type="number"
                                                value={workingHours}
                                                onChange={e => setWorkingHours(Number(e.target.value))}
                                                className="h-12 text-lg font-bold w-32"
                                            />
                                            <span className="text-muted-foreground">horas por mês</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground italic">Ex: 8h por dia, 20 dias por mês = 160h</p>
                                    </div>

                                    <Separator />

                                    <div className="grid gap-3">
                                        <Label htmlFor="defaultProfitMargin" className="text-lg font-semibold flex items-center gap-2">
                                            Margem de Lucro Padrão (%)
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info size={14} className="text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Margem para reinvestimento e crescimento (além do seu salário).</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </Label>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                id="defaultProfitMargin"
                                                name="defaultProfitMargin"
                                                type="number"
                                                defaultValue={settings.defaultProfitMargin || 50}
                                                className="h-12 text-lg font-bold w-32"
                                            />
                                            <span className="text-muted-foreground">%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Fixed Costs */}
                                <div className="bg-muted/30 p-6 rounded-2xl border border-dashed space-y-4">
                                    <Label className="text-lg font-semibold flex items-center gap-2">
                                        3. Custos Fixos do Ateliê
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info size={14} className="text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>Despesas que você tem independente de vender ou não (Luz, Internet, Aluguel, MEI).</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Label>

                                    <div className="space-y-3">
                                        {fixedCosts.map(cost => (
                                            <div key={cost.id} className="flex items-center justify-between bg-background p-3 rounded-lg border shadow-sm group">
                                                <span className="font-medium">{cost.label}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold">R$ {cost.value.toFixed(2)}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => removeFixedCost(cost.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <div className="flex-grow grid gap-1">
                                            <Input
                                                placeholder="Ex: Internet"
                                                value={newCostLabel}
                                                onChange={e => setNewCostLabel(e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="w-24 grid gap-1">
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={newCostValue}
                                                onChange={e => setNewCostValue(e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <Button type="button" size="icon" onClick={addFixedCost} className="shrink-0 h-9 w-9">
                                            <Plus size={16} />
                                        </Button>
                                    </div>

                                    <div className="pt-4 flex justify-between items-center text-sm">
                                        <span className="font-medium text-muted-foreground">Total de Custos Fixos:</span>
                                        <span className="text-lg font-black tracking-tight">R$ {totalFixedCosts.toFixed(2)}</span>
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
                                    defaultValue={settings.msgQuotation || "Olá {cliente}, aqui está o orçamento dos seus produtos..."}
                                />
                                <p className="text-[10px] text-muted-foreground">Tags: {'{cliente}'}, {'{valor}'}, {'{itens}'}</p>
                            </div>

                            <Separator />

                            <div className="grid gap-2">
                                <Label htmlFor="msgApproved">2. Pedido Aprovado / Produção Iniciada</Label>
                                <Textarea
                                    id="msgApproved"
                                    name="msgApproved"
                                    className="min-h-[80px]"
                                    defaultValue={settings.msgApproved || "Olá {cliente}, seu pedido foi aprovado e iniciamos a produção!"}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="msgReady">3. Pedido Pronto para Entrega</Label>
                                <Textarea
                                    id="msgReady"
                                    name="msgReady"
                                    className="min-h-[80px]"
                                    defaultValue={settings.msgReady || "Olá {cliente}, boas notícias! Seu pedido está prontinho."}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="msgFinished">4. Agradecimento Pós-Entrega</Label>
                                <Textarea
                                    id="msgFinished"
                                    name="msgFinished"
                                    className="min-h-[80px]"
                                    defaultValue={settings.msgFinished || "Olá {cliente}, muito obrigado por sua compra! Espero que tenha gostado."}
                                />
                            </div>
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
                                <Label>Cor Primária</Label>
                                <div className="flex gap-4">
                                    {['indigo', 'rose', 'emerald', 'slate'].map((color) => (
                                        <label key={color} className="cursor-pointer">
                                            <input
                                                type="radio"
                                                name="primaryColor"
                                                value={color}
                                                defaultChecked={settings.primaryColor === color}
                                                className="sr-only peer"
                                            />
                                            <div className="w-16 h-16 rounded-xl border-2 peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-offset-2 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all">
                                                <div className={`w-8 h-8 rounded-full bg-${color}-500`} style={{ backgroundColor: color === 'indigo' ? '#4f46e5' : color === 'rose' ? '#e11d48' : color === 'emerald' ? '#10b981' : '#64748b' }} />
                                            </div>
                                            <span className="block text-center text-xs mt-1 capitalize">{color}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Manutenção / Sistema */}
                <TabsContent value="maintenance">
                    <BackupManager />
                </TabsContent>

                {/* Carga em Lote */}
                <TabsContent value="bulk-import">
                    <BulkImport />
                </TabsContent>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 pt-4 sticky bottom-4 z-10">
                    <Button type="submit" size="lg" className="shadow-xl" disabled={isPending}>
                        <Save className="mr-2 h-5 w-5" /> {isPending ? 'Salvando...' : 'Salvar Todas as Configurações'}
                    </Button>
                </div>
            </Tabs>
        </form>
    )
}


