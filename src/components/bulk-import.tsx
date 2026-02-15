'use client'

import { type ChangeEvent, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Table as TableIcon,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  importCustomersAction,
  importMaterialsAction,
  importStockAction,
  importSuppliersAction,
} from '@/features/bulk-import/actions'
import { cn } from '@/lib/utils'

type ImportType = 'materials' | 'stock' | 'customers' | 'suppliers'

type CsvRow = Record<string, string>

interface MappingField {
  label: string
  key: string
  required: boolean
}

const MAX_CSV_SIZE_BYTES = 2 * 1024 * 1024

const FIELDS_MAP: Record<ImportType, MappingField[]> = {
  materials: [
    { label: 'Nome', key: 'name', required: true },
    { label: 'Unidade (ex: un, m, kg)', key: 'unit', required: true },
    { label: 'Custo Unitario', key: 'cost', required: true },
    { label: 'Estoque Minimo', key: 'minQuantity', required: false },
  ],
  customers: [
    { label: 'Nome', key: 'name', required: true },
    { label: 'Telefone', key: 'phone', required: false },
    { label: 'Email', key: 'email', required: false },
    { label: 'Endereco', key: 'address', required: false },
    { label: 'Observacoes', key: 'notes', required: false },
  ],
  suppliers: [
    { label: 'Nome', key: 'name', required: true },
    { label: 'Contato', key: 'contact', required: false },
    { label: 'Telefone', key: 'phone', required: false },
    { label: 'Email', key: 'email', required: false },
    { label: 'Endereco', key: 'address', required: false },
    { label: 'Observacoes', key: 'notes', required: false },
  ],
  stock: [
    { label: 'Nome do Material', key: 'materialName', required: true },
    { label: 'Quantidade em Estoque', key: 'quantity', required: true },
    { label: 'Motivo (Opcional)', key: 'reason', required: false },
  ],
}

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function parseCsv(content: string): CsvRow[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]

    if (char === '"') {
      if (quoted && content[i + 1] === '"') {
        field += '"'
        i += 1
      } else {
        quoted = !quoted
      }
      continue
    }

    if (char === ',' && !quoted) {
      row.push(field.trim())
      field = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && content[i + 1] === '\n') {
        i += 1
      }
      row.push(field.trim())
      field = ''
      if (row.some(column => column.length > 0)) {
        rows.push(row)
      }
      row = []
      continue
    }

    field += char
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim())
    if (row.some(column => column.length > 0)) {
      rows.push(row)
    }
  }

  if (rows.length < 2) {
    return []
  }

  const headers = rows[0].map(header => header.replace(/^\uFEFF/, '').trim())

  return rows.slice(1).map(columns => {
    const item: CsvRow = {}
    headers.forEach((header, index) => {
      item[header] = columns[index] ?? ''
    })
    return item
  })
}

export function BulkImport() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [type, setType] = useState<ImportType>('materials')
  const [fileData, setFileData] = useState<CsvRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Formato invalido. Envie um arquivo .csv.')
      return
    }

    if (file.size > MAX_CSV_SIZE_BYTES) {
      toast.error('Arquivo grande demais. Limite de 2 MB por importacao.')
      return
    }

    const reader = new FileReader()
    reader.onload = fileEvent => {
      const content = String(fileEvent.target?.result ?? '')
      const json = parseCsv(content)

      if (json.length === 0) {
        toast.error('Arquivo vazio ou formato invalido.')
        return
      }

      const fileHeaders = Object.keys(json[0])
      setFileData(json)
      setHeaders(fileHeaders)

      const initialMapping: Record<string, string> = {}
      FIELDS_MAP[type].forEach(field => {
        const normalizedFieldLabel = normalizeLabel(field.label)
        const normalizedFieldKey = normalizeLabel(field.key)
        const match = fileHeaders.find(header => {
          const normalizedHeader = normalizeLabel(header)
          return (
            normalizedHeader.includes(normalizedFieldLabel) ||
            normalizedHeader.includes(normalizedFieldKey)
          )
        })

        if (match) {
          initialMapping[field.key] = match
        }
      })

      setMapping(initialMapping)
      setStep(3)
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleImport = async () => {
    const missing = FIELDS_MAP[type].filter(field => field.required && !mapping[field.key])
    if (missing.length > 0) {
      toast.error(`Mapeie os campos obrigatorios: ${missing.map(item => item.label).join(', ')}`)
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const preparedData = fileData.map(row => {
        const item: Record<string, string> = {}
        FIELDS_MAP[type].forEach(field => {
          const csvColumn = mapping[field.key]
          if (csvColumn) {
            item[field.key] = row[csvColumn]
          }
        })
        return item
      })

      const chunkSize = 50
      const totalChunks = Math.ceil(preparedData.length / chunkSize)
      let successCount = 0
      const errors: string[] = []

      for (let i = 0; i < totalChunks; i += 1) {
        const chunk = preparedData.slice(i * chunkSize, (i + 1) * chunkSize)

        let result
        switch (type) {
          case 'materials':
            result = await importMaterialsAction(chunk)
            break
          case 'stock':
            result = await importStockAction(chunk)
            break
          case 'customers':
            result = await importCustomersAction(chunk)
            break
          case 'suppliers':
            result = await importSuppliersAction(chunk)
            break
        }

        if (result.success) {
          successCount += chunk.length
        } else {
          errors.push(`Erro no lote ${i + 1}: ${result.message}`)
        }

        setProgress(Math.round(((i + 1) / totalChunks) * 100))
      }

      if (errors.length === 0) {
        toast.success(`Importacao concluida! ${preparedData.length} registros processados.`)
        setStep(1)
        setFileData([])
        setType('materials')
      } else if (successCount > 0) {
        toast.warning(
          `Importacao parcial: ${successCount} sucessos. ${errors.length} lotes com erro.`
        )
        console.error('Import errors:', errors)
      } else {
        toast.error('Falha na importacao. Verifique o console para detalhes.')
        console.error('All chunks failed:', errors)
      }
    } catch (error) {
      console.error('Import exception:', error)
      toast.error('Erro ao processar importacao.')
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const downloadTemplate = () => {
    try {
      const fields = FIELDS_MAP[type].map(field => field.label)
      const sampleData: string[][] = [fields]

      if (type === 'materials') {
        sampleData.push(['Papelao Cinza 2mm', 'un', '15.00', '5'])
        sampleData.push(['Tecido Tricoline', 'm', '28.00', '2'])
      } else if (type === 'customers') {
        sampleData.push([
          'Maria Oliveira',
          '(11) 99999-8888',
          'maria@email.com',
          'Rua das Flores, 123',
          'Gosta de cores pasteis',
        ])
      } else if (type === 'suppliers') {
        sampleData.push([
          'Comercial Papeis',
          'Joao',
          '(11) 4444-5555',
          'vendas@compapeis.com',
          'Av. Industrial, 500',
          'Entrega semanal',
        ])
      } else if (type === 'stock') {
        sampleData.push(['Papelao Cinza 2mm', '10', 'Carga inicial'])
      }

      const escapeCsv = (value: string) => `"${String(value).replace(/"/g, '""')}"`
      const csvContent = sampleData.map(line => line.map(escapeCsv).join(',')).join('\n')
      const dataBlob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(dataBlob)

      const link = document.createElement('a')
      link.href = url
      link.download = `modelo_importacao_${type}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Modelo baixado com sucesso!')
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error('Erro ao gerar o arquivo de modelo.')
    }
  }

  return (
    <Card className="border-primary/10 bg-primary/5 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="text-primary" /> Carga em Lote
        </CardTitle>
        <CardDescription>
          Importe dados rapidamente por arquivo CSV. Para mais seguranca, o app nao aceita XLSX.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-8 flex items-center justify-between px-4">
          {[1, 2, 3].map(stepNumber => (
            <div key={stepNumber} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full font-bold transition-all',
                  step === stepNumber
                    ? 'bg-primary text-primary-foreground scale-110 shadow-lg'
                    : step > stepNumber
                      ? 'bg-success text-white'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {step > stepNumber ? <CheckCircle2 size={16} /> : stepNumber}
              </div>
              <span
                className={cn(
                  'hidden text-xs font-bold tracking-wider uppercase sm:block',
                  step === stepNumber ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {stepNumber === 1 ? 'Tipo' : stepNumber === 2 ? 'Upload' : 'De/Para'}
              </span>
              {stepNumber < 3 && <div className="bg-muted mx-2 h-[2px] w-8 sm:w-16" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                id: 'materials',
                label: 'Materiais',
                sub: 'Cadastro base de insumos',
                icon: <CheckCircle2 />,
              },
              {
                id: 'stock',
                label: 'Saldo de Estoque',
                sub: 'Carga inicial de quantidades',
                icon: <TableIcon />,
              },
              {
                id: 'customers',
                label: 'Clientes',
                sub: 'Dados de contato e enderecos',
                icon: <Upload />,
              },
              {
                id: 'suppliers',
                label: 'Fornecedores',
                sub: 'Rede de fornecimento',
                icon: <FileSpreadsheet />,
              },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setType(item.id as ImportType)
                  setStep(2)
                }}
                className="hover:border-primary/40 group flex items-start gap-4 rounded-2xl border-2 border-transparent bg-white p-6 text-left transition-all hover:shadow-xl active:scale-95"
              >
                <div className="bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground rounded-xl p-3 transition-colors">
                  {item.id === 'materials' ? (
                    <CheckCircle2 size={24} />
                  ) : item.id === 'stock' ? (
                    <TableIcon size={24} />
                  ) : item.id === 'customers' ? (
                    <Upload size={24} />
                  ) : (
                    <FileSpreadsheet size={24} />
                  )}
                </div>
                <div>
                  <p className="text-foreground font-black">{item.label}</p>
                  <p className="text-muted-foreground text-xs">{item.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <div
              className="border-primary/20 hover:bg-primary/5 hover:border-primary/40 group cursor-pointer rounded-[2rem] border-4 border-dashed bg-white p-12 text-center transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".csv,text/csv"
              />
              <div className="bg-primary/5 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-transform group-hover:scale-110">
                <Upload className="text-primary h-10 w-10" />
              </div>
              <h3 className="text-foreground mb-2 text-xl font-black">Selecione o arquivo CSV</h3>
              <p className="text-muted-foreground mx-auto max-w-xs">
                Arraste ou clique para carregar sua planilha com{' '}
                <span className="text-primary font-bold">{FIELDS_MAP[type].length} campos</span>.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} className="font-bold">
                Voltar
              </Button>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="border-primary/20 gap-2 font-bold"
              >
                <Download size={16} /> Baixar modelo CSV
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <div className="rounded-3xl border bg-white p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-foreground flex items-center gap-2 font-black">
                  <TableIcon size={18} /> Mapeamento de colunas
                </h3>
                <span className="bg-success/10 text-success rounded-full px-3 py-1 text-xs font-bold">
                  {fileData.length} registros encontrados
                </span>
              </div>

              <div className="space-y-4">
                {FIELDS_MAP[type].map(field => (
                  <div
                    key={field.key}
                    className="grid grid-cols-1 items-center gap-4 border-b border-dashed py-3 last:border-0 sm:grid-cols-2"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-bold">{field.label}</p>
                      {field.required && <span className="text-xs text-red-500">*</span>}
                    </div>
                    <Select
                      value={mapping[field.key] || ''}
                      onValueChange={value =>
                        setMapping(previous => ({ ...previous, [field.key]: value }))
                      }
                      disabled={isProcessing}
                    >
                      <SelectTrigger className="border-primary/20 bg-primary/5 h-11 rounded-xl">
                        <SelectValue placeholder="Selecione a coluna..." />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map(header => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="text-muted-foreground flex justify-between text-sm">
                  <span>Processando importacao...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                className="font-bold"
                disabled={isProcessing}
              >
                Alterar arquivo
              </Button>
              <Button
                onClick={handleImport}
                disabled={isProcessing}
                className="shadow-primary/20 h-12 gap-2 rounded-2xl px-8 font-black shadow-lg"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                {isProcessing ? 'Importando...' : 'Confirmar importacao'}
              </Button>
            </div>

            {step === 3 && headers.length === 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertCircle className="h-4 w-4" />
                Nao foi possivel ler o cabecalho do arquivo CSV.
              </div>
            )}

            {fileData.length > 5000 && (
              <div className="text-muted-foreground flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
                <ArrowRight className="h-4 w-4" />
                Arquivo grande: a importacao pode levar alguns minutos.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
