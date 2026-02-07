"use client"

import { useState, useRef } from "react"
import * as XLSX from "xlsx"
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Download,
    Loader2,
    Table as TableIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
    importMaterialsAction,
    importStockAction,
    importCustomersAction,
    importSuppliersAction
} from "@/features/bulk-import/actions"
import { cn } from "@/lib/utils"

type ImportType = "materials" | "stock" | "customers" | "suppliers"

interface MappingField {
    label: string
    key: string
    required: boolean
}

const FIELDS_MAP: Record<ImportType, MappingField[]> = {
    materials: [
        { label: "Nome", key: "name", required: true },
        { label: "Unidade (ex: un, m, kg)", key: "unit", required: true },
        { label: "Custo Unitário", key: "cost", required: true },
        { label: "Estoque Mínimo", key: "minQuantity", required: false },
    ],
    customers: [
        { label: "Nome", key: "name", required: true },
        { label: "Telefone", key: "phone", required: false },
        { label: "Email", key: "email", required: false },
        { label: "Endereço", key: "address", required: false },
        { label: "Observações", key: "notes", required: false },
    ],
    suppliers: [
        { label: "Nome", key: "name", required: true },
        { label: "Contato", key: "contact", required: false },
        { label: "Telefone", key: "phone", required: false },
        { label: "Email", key: "email", required: false },
        { label: "Endereço", key: "address", required: false },
        { label: "Observações", key: "notes", required: false },
    ],
    stock: [
        { label: "Nome do Material", key: "materialName", required: true },
        { label: "Quantidade em Estoque", key: "quantity", required: true },
        { label: "Motivo (Opcional)", key: "reason", required: false },
    ],
}

export function BulkImport() {
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [type, setType] = useState<ImportType>("materials")
    const [fileData, setFileData] = useState<any[]>([])
    const [headers, setHeaders] = useState<string[]>([])
    const [mapping, setMapping] = useState<Record<string, string>>({})
    const [isProcessing, setIsProcessing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const data = new Uint8Array(event.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: "array" })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const json = XLSX.utils.sheet_to_json(worksheet)

            if (json.length === 0) {
                toast.error("Arquivo vazio ou formato inválido.")
                return
            }

            const fileHeaders = Object.keys(json[0] as any)
            setFileData(json)
            setHeaders(fileHeaders)

            // Auto-mapping attempt
            const initialMapping: Record<string, string> = {}
            FIELDS_MAP[type].forEach(field => {
                const match = fileHeaders.find(h =>
                    h.toLowerCase().includes(field.label.toLowerCase()) ||
                    h.toLowerCase().includes(field.key.toLowerCase())
                )
                if (match) initialMapping[field.key] = match
            })

            setMapping(initialMapping)
            setStep(3)
        }
        reader.readAsArrayBuffer(file)
    }

    const handleImport = async () => {
        // Check required mappings
        const missing = FIELDS_MAP[type].filter(f => f.required && !mapping[f.key])
        if (missing.length > 0) {
            toast.error(`Mapeie os campos obrigatórios: ${missing.map(m => m.label).join(", ")}`)
            return
        }

        setIsProcessing(true)
        try {
            const preparedData = fileData.map(row => {
                const item: any = {}
                FIELDS_MAP[type].forEach(field => {
                    const excelColumn = mapping[field.key]
                    if (excelColumn) {
                        item[field.key] = row[excelColumn]
                    }
                })
                return item
            })

            let result
            switch (type) {
                case "materials": result = await importMaterialsAction(preparedData); break
                case "stock": result = await importStockAction(preparedData); break
                case "customers": result = await importCustomersAction(preparedData); break
                case "suppliers": result = await importSuppliersAction(preparedData); break
            }

            if (result.success) {
                toast.success(result.message)
                setStep(1)
                setFileData([])
                setType("materials")
            } else {
                toast.error(result.message)
            }
        } catch (err) {
            toast.error("Erro ao processar importação.")
        } finally {
            setIsProcessing(false)
        }
    }

    const downloadTemplate = () => {
        try {
            const fields = FIELDS_MAP[type].map(f => f.label)

            // Generate some sample data for each type to make it more useful
            let sampleData = [fields]
            if (type === "materials") {
                sampleData.push(["Papelão Cinza 2mm", "un", "15.00", "5"])
                sampleData.push(["Tecido Tricoline", "m", "28.00", "2"])
            } else if (type === "customers") {
                sampleData.push(["Maria Oliveira", "(11) 99999-8888", "maria@email.com", "Rua das Flores, 123", "Gosta de cores pastéis"])
            } else if (type === "suppliers") {
                sampleData.push(["Comercial Papéis", "João", "(11) 4444-5555", "vendas@compapeis.com", "Av. Industrial, 500", "Entrega semanal"])
            } else if (type === "stock") {
                sampleData.push(["Papelão Cinza 2mm", "10", "Carga inicial"])
            }

            const ws = XLSX.utils.aoa_to_sheet(sampleData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Template")

            // Use a more robust download method to ensure filename and extension
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
            const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(dataBlob)

            const link = document.createElement('a')
            link.href = url
            link.download = `modelo_importacao_${type}.xlsx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success("Modelo baixado com sucesso! Use-o como base para seus dados.")
        } catch (error) {
            console.error("Error downloading template:", error)
            toast.error("Erro ao gerar o arquivo de modelo.")
        }
    }

    return (
        <Card className="border-primary/10 bg-primary/5 shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="text-primary" /> Carga em Lote
                </CardTitle>
                <CardDescription>
                    Importe dados rapidamente através de arquivos Excel (.xlsx ou .csv).
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Step Indicators */}
                <div className="flex items-center justify-between mb-8 px-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all",
                                step === s ? "bg-primary text-white scale-110 shadow-lg" :
                                    step > s ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                            )}>
                                {step > s ? <CheckCircle2 size={16} /> : s}
                            </div>
                            <span className={cn(
                                "text-xs font-bold uppercase tracking-wider hidden sm:block",
                                step === s ? "text-primary" : "text-muted-foreground"
                            )}>
                                {s === 1 ? "Tipo" : s === 2 ? "Upload" : "De/Para"}
                            </span>
                            {s < 3 && <div className="h-[2px] w-8 sm:w-16 bg-muted mx-2" />}
                        </div>
                    ))}
                </div>

                {/* STEP 1: SELECT TYPE */}
                {step === 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
                        {[
                            { id: "materials", label: "Materiais", sub: "Cadastro base de insumos", icon: <CheckCircle2 /> },
                            { id: "stock", label: "Saldo de Estoque", sub: "Carga inicial de quantidades", icon: <TableIcon /> },
                            { id: "customers", label: "Clientes", sub: "Dados de contato e endereços", icon: <Upload /> },
                            { id: "suppliers", label: "Fornecedores", sub: "Rede de fornecimento", icon: <FileSpreadsheet /> },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => { setType(t.id as ImportType); setStep(2); }}
                                className="p-6 rounded-2xl border-2 border-transparent bg-white hover:border-primary/40 hover:shadow-xl transition-all text-left flex items-start gap-4 active:scale-95 group"
                            >
                                <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    {t.id === "materials" ? <CheckCircle2 size={24} /> :
                                        t.id === "stock" ? <TableIcon size={24} /> :
                                            t.id === "customers" ? <Upload size={24} /> : <FileSpreadsheet size={24} />}
                                </div>
                                <div>
                                    <p className="font-black text-[#455448]">{t.label}</p>
                                    <p className="text-xs text-muted-foreground">{t.sub}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* STEP 2: UPLOAD FILE */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div
                            className="border-4 border-dashed border-primary/20 rounded-[2rem] p-12 text-center bg-white hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".xlsx, .xls, .csv"
                            />
                            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Upload className="text-primary w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-[#455448] mb-2">Selecione o arquivo Excel</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto">
                                Arraste ou clique para carregar sua planilha de <span className="text-primary font-bold">{FIELDS_MAP[type].map(f => f.label).length} campos</span>.
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <Button variant="ghost" onClick={() => setStep(1)} className="font-bold">
                                Voltar
                            </Button>
                            <Button variant="outline" onClick={downloadTemplate} className="gap-2 font-bold border-primary/20">
                                <Download size={16} /> Baixar Modelo
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 3: MAPPING */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white rounded-3xl border p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-[#455448] flex items-center gap-2">
                                    <TableIcon size={18} /> Mapeamento de Colunas
                                </h3>
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
                                    {fileData.length} registros encontrados
                                </span>
                            </div>

                            <div className="space-y-4">
                                {FIELDS_MAP[type].map(field => (
                                    <div key={field.key} className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-3 border-b border-dashed last:border-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-[#455448]">{field.label}</p>
                                            {field.required && <span className="text-red-500 text-xs">*</span>}
                                        </div>
                                        <Select
                                            value={mapping[field.key] || ""}
                                            onValueChange={(val) => setMapping(prev => ({ ...prev, [field.key]: val }))}
                                        >
                                            <SelectTrigger className="rounded-xl border-primary/20 h-11 bg-primary/5">
                                                <SelectValue placeholder="Selecione a coluna..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {headers.map(h => (
                                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <Button variant="ghost" onClick={() => setStep(2)} className="font-bold">
                                Alterar Arquivo
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={isProcessing}
                                className="gap-2 h-12 px-8 rounded-2xl font-black shadow-lg shadow-primary/20"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                                Confirmar Importação
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
