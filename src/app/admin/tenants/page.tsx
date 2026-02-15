import { getTenants } from '@/features/admin/actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, LogIn, ExternalLink } from 'lucide-react'

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const tenants = await getTenants(50, q)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ateliês</h1>
          <p className="text-slate-500">Gestão de ateliês, lojas e contas.</p>
        </div>
        <Button>
          <ExternalLink className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Todos os ateliês</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-500" />
              <form>
                <Input
                  name="q"
                  placeholder="Buscar por nome..."
                  className="pl-9"
                  defaultValue={q}
                />
              </form>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa (slug)</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map(tenant => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{tenant.name}</span>
                      <span className="text-xs text-slate-400">/{tenant.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tenant.owner ? (
                      <div className="flex flex-col">
                        <span>{tenant.owner.name}</span>
                        <span className="text-xs text-slate-400">{tenant.owner.email}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Sem usuário</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {tenant.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="border-green-200 bg-green-100 text-green-700 hover:bg-green-100">
                      Ativo
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Acessar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {tenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum ateliê encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
