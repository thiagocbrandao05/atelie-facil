'use client'

import { deleteMaterial } from "@/features/materials/actions"
import { DeleteButton } from "./delete-button"

interface DeleteMaterialButtonProps {
    id: string
    name: string
}

export function DeleteMaterialButton({ id, name }: DeleteMaterialButtonProps) {
    return (
        <DeleteButton
            id={id}
            onDelete={deleteMaterial}
            label=""
            variant="ghost"
            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
        />
    )
}


