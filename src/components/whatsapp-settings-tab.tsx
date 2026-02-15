'use client'

import { useActionState, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  MessageSquare,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react'
import { saveWhatsAppCredentials, validateWhatsAppCredentials } from '@/features/whatsapp/actions'
import { toast } from 'sonner'
import { AppSettings } from '@/lib/types'
import { UsageSummary } from '@/features/subscription/types'

const initialState = { success: false, message: '' }

import { WhatsAppUsageCard } from '@/features/whatsapp/components/usage-card'

export function WhatsAppSettingsTab({
  settings,
  usageSummary,
}: {
  settings: AppSettings
  usageSummary?: UsageSummary | null
}) {
  const [state, saveAction, isPending] = useActionState(saveWhatsAppCredentials, initialState)
  const [validating, setValidating] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [verified, setVerified] = useState(settings.whatsappConfigVerified || false)
  const [showTutorial, setShowTutorial] = useState(false)

  const handleValidation = async () => {
    setValidating(true)
    try {
      const result = await validateWhatsAppCredentials()
      if (result.success) {
        toast.success(result.message)
        setVerified(true)
      } else {
        toast.error(result.message)
        setVerified(false)
      }
    } catch (error) {
      toast.error('Erro ao validar credenciais.')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-l-primary border-l-4 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="text-primary h-6 w-6" />
            Conexão com WhatsApp
          </CardTitle>
          <CardDescription className="text-base">
            Configure aqui o envio automático de mensagens para seus clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/40 flex items-center gap-4 rounded-xl border p-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${verified ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}
            >
              {verified ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            </div>
            <div className="flex-grow">
              <p className="text-foreground font-semibold">
                {verified ? 'Sistema Conectado e Operante' : 'Configuração Pendente'}
              </p>
              <p className="text-muted-foreground text-sm">
                {verified
                  ? 'O Atelis está pronto para enviar notificações.'
                  : 'Preencha os dados abaixo para ativar as mensagens.'}
              </p>
            </div>
            {verified && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                Ativo
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Limits Card */}
      <WhatsAppUsageCard summary={usageSummary ?? null} />

      {/* Tutorial Accordion */}
      <Card className="border-blue-100 bg-blue-50/50">
        <button
          onClick={() => setShowTutorial(!showTutorial)}
          className="flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors hover:bg-blue-50/80"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Não sabe como obter os dados?</h3>
              <p className="text-sm text-blue-700">
                Clique aqui para ver o passo a passo simplificado.
              </p>
            </div>
          </div>
          <div className="text-blue-400">
            {showTutorial ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {showTutorial && (
          <CardContent className="animate-in slide-in-from-top-2 px-4 pt-0 pb-6 sm:px-16">
            <div className="mt-4 space-y-6 border-l-2 border-blue-200 pl-6 text-sm text-slate-600">
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 font-semibold text-blue-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                    1
                  </span>
                  Acesse o Painel da Meta (Facebook)
                </h4>
                <p>
                  Entre no site{' '}
                  <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                  >
                    Meta for Developers <ExternalLink size={10} />
                  </a>{' '}
                  e faça login com seu Facebook.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="flex items-center gap-2 font-semibold text-blue-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                    2
                  </span>
                  Selecione (ou Crie) seu Aplicativo
                </h4>
                <p>
                  Clique em &quot;Meus Apps&quot; e selecione o aplicativo do seu negócio. Se não
                  tiver, crie um novo do tipo &quot;Business&quot; (Negócios).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="flex items-center gap-2 font-semibold text-blue-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                    3
                  </span>
                  Pegue os Dados na área &quot;API de Configuração&quot;
                </h4>
                <p>
                  No menu lateral esquerdo, vá em{' '}
                  <strong>WhatsApp {'>'} API de Configuração</strong>.
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    Copie o número em <strong>Identificação do número de telefone</strong> (Cole no
                    campo 1 abaixo).
                  </li>
                  <li>
                    Gere um <strong>Token de Acesso Permanente</strong> (usuário do sistema) e copie
                    o código longo que começa com &quot;EAAG...&quot; (Cole no campo 2 abaixo).
                  </li>
                </ul>
                <Alert className="mt-2 border-yellow-200 bg-yellow-50 text-yellow-800">
                  <HelpCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-xs">
                    Importante: Não use o &quot;Token Temporário&quot; que dura apenas 24h, senão o
                    sistema vai parar de funcionar amanhã.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <form action={saveAction} className="space-y-8">
            <div className="grid gap-6">
              {/* Field 1 */}
              <div className="space-y-3">
                <Label
                  htmlFor="whatsappPhoneNumberId"
                  className="flex items-center gap-2 text-base font-medium"
                >
                  1. Identificação do Número de Telefone
                  <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-xs font-normal">
                    Phone Number ID
                  </span>
                </Label>
                <Input
                  id="whatsappPhoneNumberId"
                  name="whatsappPhoneNumberId"
                  defaultValue={settings.whatsappPhoneNumberId || ''}
                  placeholder="Ex: 104567890123456"
                  required
                  className="h-12 text-lg"
                />
                <p className="text-muted-foreground text-xs">
                  É um número longo que identifica seu telefone no sistema do Facebook. Não é o seu
                  número de telefone com DDD.
                </p>
              </div>

              {/* Field 2 */}
              <div className="space-y-3">
                <Label
                  htmlFor="whatsappAccessToken"
                  className="flex items-center gap-2 text-base font-medium"
                >
                  2. Token de Acesso (Chave Secreta)
                  <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-xs font-normal">
                    Access Token
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    id="whatsappAccessToken"
                    name="whatsappAccessToken"
                    type={showToken ? 'text' : 'password'}
                    defaultValue={settings.whatsappAccessToken || ''}
                    placeholder="Começa com EAAG..."
                    required
                    className="h-12 pr-12 font-mono text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="hover:bg-muted text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-2 transition-colors"
                    title={showToken ? 'Ocultar' : 'Mostrar'}
                  >
                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Esta é a chave que permite ao Atelis enviar mensagens por você. Mantenha em
                  segredo.
                </p>
              </div>
            </div>

            {state.message && (
              <Alert
                variant={state.success ? 'default' : 'destructive'}
                className={state.success ? 'border-green-200 bg-green-50 text-green-800' : ''}
              >
                <div className="flex items-center gap-2">
                  {state.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <AlertTitle>{state.success ? 'Sucesso!' : 'Atenção'}</AlertTitle>
                </div>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row">
              <Button
                type="submit"
                disabled={isPending}
                className="h-12 flex-1 text-base shadow-sm"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                Salvar Configurações
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleValidation}
                disabled={validating || isPending}
                className="hover:bg-muted/50 h-12 flex-1 border-2 text-base"
              >
                {validating ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                )}
                Testar Conexão
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
