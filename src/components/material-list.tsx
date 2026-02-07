// ... imports
import { Material, Supplier } from "@/lib/types"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DeleteMaterialButton } from "./delete-material-button"
import { MaterialForm } from "./material-form"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

interface MaterialListProps {
    materials: Material[]
    suppliers?: Supplier[]
}

export function MaterialList({ materials, suppliers = [] }: MaterialListProps) {
    if (materials.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/10 rounded-lg">
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
                    {materials.map((material) => (
                        <TableRow key={material.id}>
                            <TableCell className="font-medium">{material.name}</TableCell>
                            <TableCell>{material.unit}</TableCell>
                            <TableCell>
                                {material.colors && material.colors.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {material.colors.map(c => (
                                            <Badge key={c} variant="secondary" className="text-[10px] px-1 py-0">{c}</Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end items-center gap-2">
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




