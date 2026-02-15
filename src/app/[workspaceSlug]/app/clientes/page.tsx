import { getCustomers } from '@/features/customers/actions'
import { CustomerForm } from '@/components/customer-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Phone, Mail, MapPin, Plus } from 'lucide-react'
import { CustomerDialog } from '@/components/customer-dialog'
import { CustomerHistoryDialog } from '@/components/customer-history-dialog'
import type { Customer } from '@/lib/types'

export default async function ClientesPage() {
  const customers = (await getCustomers()) as Customer[]

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 md:space-y-8 md:py-8">
      <div className="flex flex-col gap-2">
        <h1 className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
          Gestão de clientes
        </h1>
        <p className="text-muted-foreground text-sm font-medium sm:text-base">
          Cadastre e gerencie a base de clientes do seu ateliê.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:sticky lg:top-8 lg:col-span-4">
          <Card className="shadow-primary/5 bg-background overflow-hidden rounded-3xl border-none shadow-xl">
            <CardHeader className="bg-primary/5 pb-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground shadow-primary/20 flex h-8 w-8 items-center justify-center rounded-full shadow-lg">
                  <Plus className="h-4 w-4" />
                </div>
                <CardTitle className="text-lg">Novo cliente</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <CustomerForm />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="shadow-primary/5 bg-background overflow-hidden rounded-3xl border-none shadow-xl">
            <CardHeader className="bg-muted/5 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-lg">Clientes cadastrados ({customers.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4 text-[10px] font-bold tracking-widest uppercase sm:pl-6">
                        Cliente
                      </TableHead>
                      <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                        Contato
                      </TableHead>
                      <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                        Localização
                      </TableHead>
                      <TableHead className="w-24 pr-4 text-right sm:pr-6" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-muted-foreground py-12 text-center italic"
                        >
                          Nenhum cliente cadastrado ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map(customer => (
                        <TableRow
                          key={customer.id}
                          className="group hover:bg-muted/20 transition-colors"
                        >
                          <TableCell className="py-4 pl-4 sm:pl-6">
                            <div className="flex items-center gap-3">
                              <div className="bg-secondary text-primary flex h-9 w-9 items-center justify-center rounded-full font-bold shadow-inner">
                                {customer.name.charAt(0)}
                              </div>
                              <span className="group-hover:text-primary text-sm font-bold transition-colors">
                                {customer.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {customer.phone && (
                                <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-medium">
                                  <Phone className="text-primary/60 h-3 w-3" />
                                  {customer.phone}
                                </div>
                              )}
                              {customer.email && (
                                <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-medium">
                                  <Mail className="text-primary/60 h-3 w-3" />
                                  {customer.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.address ? (
                              <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
                                <MapPin className="text-primary/60 h-3 w-3" />
                                <span className="max-w-[150px] truncate">{customer.address}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40 text-[10px] font-bold uppercase italic">
                                Oculto
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="pr-4 text-right sm:pr-6">
                            <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                              <CustomerHistoryDialog customer={customer} />
                              <CustomerDialog customer={customer} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
