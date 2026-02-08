import { getSuppliers } from '@/features/suppliers/actions'
import { SupplierForm } from '@/components/supplier-form'
import { DeleteButton } from '@/components/delete-button'
import { deleteSupplier } from '@/features/suppliers/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Mail, MapPin, Package, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function FornecedoresPage() {
    const suppliers = await getSuppliers() as any[]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
                    <p className="text-muted-foreground">Gerencie seus parceiros de negócio</p>
                </div>
                <SupplierForm />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {suppliers.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                        <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <h3 className="font-semibold text-lg">Nenhum fornecedor cadastrado</h3>
                        <p className="text-sm text-muted-foreground mb-4">Cadastre seu primeiro fornecedor para começar.</p>
                        <SupplierForm />
                    </div>
                ) : (
                    suppliers.map((supplier) => (
                        <Card key={supplier.id} className="group hover:shadow-lg transition-all border-l-4 border-l-primary">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-bold truncate pr-4">
                                    {supplier.name}
                                </CardTitle>
                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <SupplierForm
                                        supplier={supplier}
                                        trigger={
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                <Pencil size={16} />
                                            </Button>
                                        }
                                    />
                                    <DeleteButton id={supplier.id} onDelete={deleteSupplier} />

                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm mt-2">
                                    {supplier.contact && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span className="font-medium text-foreground">Contato:</span> {supplier.contact}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone size={14} className="text-primary" />
                                        <span>{supplier.phone || 'Sem telefone'}</span>
                                    </div>

                                    {supplier.email && (
                                        <div className="flex items-center gap-2 text-muted-foreground truncate">
                                            <Mail size={14} className="text-primary" />
                                            <span className="truncate">{supplier.email}</span>
                                        </div>
                                    )}

                                    {supplier.address && (
                                        <div className="flex items-center gap-2 text-muted-foreground truncate">
                                            <MapPin size={14} className="text-primary" />
                                            <span className="truncate">{supplier.address}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
