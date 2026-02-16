// ... imports
import { Material, Supplier } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DeleteMaterialButton } from './delete-material-button'
import { MaterialForm } from './material-form'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

interface MaterialListProps {
  materials: Material[]
  suppliers?: Supplier[]
}

export function MaterialList({ materials, suppliers = [] }: MaterialListProps) {
  if (materials.length === 0) {
    return (
      <div className="bg-muted/10 flex flex-col items-center justify-center rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Nenhum material cadastrado.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Cores / Variantes</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map(material => (
            <TableRow key={material.id} className="hover:backdrop-blur-0 hover:bg-transparent">
              <TableCell className="font-medium">{material.name}</TableCell>
              <TableCell>{material.unit}</TableCell>
              <TableCell>
                {material.colors && material.colors.length > 0 ? (
                  <span className="text-sm">
                    {(() => {
                      try {
                        let parsed: unknown = material.colors
                        if (typeof parsed === 'string') {
                          // Try to parse if it's a JSON string
                          if (parsed.startsWith('[')) {
                            parsed = JSON.parse(parsed)
                          }
                        }

                        if (Array.isArray(parsed)) {
                          // Flatten and clean strings
                          return parsed
                            .flat()
                            .map(c => String(c).replace(/['"\[\]]+/g, ''))
                            .filter(Boolean)
                            .join(', ')
                        }

                        // Fallback for simple string
                        return String(parsed).replace(/['"\[\]]+/g, '')
                      } catch (e) {
                        // If parse fails, just do aggressive cleanup
                        return String(material.colors).replace(/['"\[\]]+/g, '')
                      }
                    })()}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <MaterialForm
                    suppliers={suppliers}
                    initialData={material}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DeleteMaterialButton id={material.id} name={material.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
