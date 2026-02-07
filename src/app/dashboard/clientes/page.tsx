import { getCustomers } from "@/features/customers/actions"
import { CustomerForm } from "@/components/customer-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, Phone, Mail, MapPin, Plus } from "lucide-react"
import { CustomerDialog } from "@/components/customer-dialog"
import { CustomerHistoryDialog } from "@/components/customer-history-dialog"

export default async function ClientesPage() {
    const customers = await getCustomers() as any[]

    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Gestão de Clientes</h1>
                <p className="text-muted-foreground font-medium">Cadastre e gerencie a base de clientes do seu ateliê.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 sticky top-8">
                    <Card className="rounded-3xl border-none shadow-xl shadow-primary/5 bg-background overflow-hidden">
                        <CardHeader className="bg-primary/5 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                                    <Plus className="h-4 w-4" />
                                </div>
                                <CardTitle className="text-lg">Novo Cliente</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <CustomerForm />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-8">
                    <Card className="rounded-3xl border-none shadow-xl shadow-primary/5 bg-background overflow-hidden">
                        <CardHeader className="border-b bg-muted/5 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Clientes Cadastrados ({customers.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-bold uppercase text-[10px] tracking-widest pl-6">Cliente</TableHead>
                                        <TableHead className="font-bold uppercase text-[10px] tracking-widest">Contato</TableHead>
                                        <TableHead className="font-bold uppercase text-[10px] tracking-widest">Localização</TableHead>
                                        <TableHead className="w-24 text-right pr-6"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                                                Nenhum cliente cadastrado ainda.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        customers.map((customer) => (
                                            <TableRow key={customer.id} className="group transition-colors hover:bg-muted/20">
                                                <TableCell className="pl-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-primary font-bold shadow-inner">
                                                            {customer.name.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-sm group-hover:text-primary transition-colors">{customer.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {customer.phone && (
                                                            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                                                <Phone className="h-3 w-3 text-primary/60" />
                                                                {customer.phone}
                                                            </div>
                                                        )}
                                                        {customer.email && (
                                                            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                                                <Mail className="h-3 w-3 text-primary/60" />
                                                                {customer.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {customer.address ? (
                                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                            <MapPin className="h-3 w-3 text-primary/60" />
                                                            <span className="truncate max-w-[150px]">{customer.address}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground/40 italic">Oculto</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-1 group-hover:opacity-100 transition-opacity">
                                                        <CustomerHistoryDialog customer={customer} />
                                                        <CustomerDialog customer={customer} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}


