'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Upload, Database, AlertTriangle, CheckCircle } from 'lucide-react'
import { generateBackup, restoreBackup, getBackupStats } from '@/features/backup/actions'
import { useToast } from './notification-provider'

export function BackupManager() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const toast = useToast()

  const loadStats = async () => {
    const data = await getBackupStats()
    setStats(data)
  }

  const handleBackup = async () => {
    setLoading(true)
    try {
      const result = await generateBackup()

      if (result.success && result.data) {
        // Download file
        const blob = new Blob([result.data.data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `atelis-backup-${result.data.timestamp.split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)

        toast.success('Backup Criado', 'Arquivo baixado com sucesso!')
      } else {
        toast.error('Erro', result.message)
      }
    } catch (error) {
      toast.error('Erro', 'Falha ao gerar backup')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const text = await file.text()
      const result = await restoreBackup(text)

      if (result.success) {
        toast.success('Restaurado', 'Backup restaurado com sucesso!')
        loadStats()
      } else {
        toast.error('Erro', result.message)
      }
    } catch (error) {
      toast.error('Erro', 'Arquivo de backup inválido')
    } finally {
      setLoading(false)
      event.target.value = '' // Reset input
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backup e Restauração
        </CardTitle>
        <CardDescription>
          Faça backup dos seus dados ou restaure de um backup anterior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Restaurar um backup irá substituir todos os dados atuais. Faça
            um backup antes de restaurar!
          </AlertDescription>
        </Alert>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.customers}</div>
              <div className="text-muted-foreground text-sm">Clientes</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.products}</div>
              <div className="text-muted-foreground text-sm">Produtos</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.materials}</div>
              <div className="text-muted-foreground text-sm">Materiais</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.orders}</div>
              <div className="text-muted-foreground text-sm">Pedidos</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleBackup} disabled={loading} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Fazer Backup
          </Button>

          <Button
            variant="outline"
            disabled={loading}
            className="flex-1"
            onClick={() => document.getElementById('restore-input')?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Restaurar Backup
          </Button>

          <input
            id="restore-input"
            type="file"
            accept=".json"
            onChange={handleRestore}
            className="hidden"
          />
        </div>

        <Button variant="ghost" size="sm" onClick={loadStats} className="w-full">
          <CheckCircle className="mr-2 h-4 w-4" />
          Atualizar Estatísticas
        </Button>
      </CardContent>
    </Card>
  )
}
