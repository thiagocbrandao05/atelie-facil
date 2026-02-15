import { getSuppliers } from '@/features/suppliers/actions'
import { SupplierForm } from '@/components/supplier-form'
import { DeleteButton } from '@/components/delete-button'
import { deleteSupplier } from '@/features/suppliers/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Mail, MapPin, Package, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Supplier } from '@/lib/types'

export default async function FornecedoresPage() {
  const suppliers = (await getSuppliers()) as Supplier[]

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Fornecedores</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie seus parceiros de negócio
          </p>
        </div>
        <SupplierForm />
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {suppliers.length === 0 ? (
          <div className="bg-muted/20 col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center md:p-12">
            <Package className="text-muted-foreground/50 mb-3 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhum fornecedor cadastrado</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Cadastre seu primeiro fornecedor para começar.
            </p>
            <SupplierForm />
          </div>
        ) : (
          suppliers.map(supplier => (
            <Card
              key={supplier.id}
              className="group border-l-primary border-l-4 transition-all hover:shadow-lg"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="truncate pr-4 text-lg font-bold">{supplier.name}</CardTitle>
                <div className="flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                  <SupplierForm
                    supplier={supplier}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary h-8 w-8"
                      >
                        <Pencil size={16} />
                      </Button>
                    }
                  />
                  <DeleteButton id={supplier.id} onDelete={deleteSupplier} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2 space-y-2 text-sm">
                  {supplier.contact && (
                    <div className="text-muted-foreground flex items-center gap-2">
                      <span className="text-foreground font-medium">Contato:</span>{' '}
                      {supplier.contact}
                    </div>
                  )}

                  <div className="text-muted-foreground flex items-center gap-2">
                    <Phone size={14} className="text-primary" />
                    <span>{supplier.phone || 'Sem telefone'}</span>
                  </div>

                  {supplier.email && (
                    <div className="text-muted-foreground flex items-center gap-2 truncate">
                      <Mail size={14} className="text-primary" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}

                  {supplier.address && (
                    <div className="text-muted-foreground flex items-center gap-2 truncate">
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
