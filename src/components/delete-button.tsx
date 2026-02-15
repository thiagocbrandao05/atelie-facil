'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import type { ActionResponse } from '@/lib/types'

interface DeleteButtonProps {
  id: string
  onDelete: (id: string) => Promise<ActionResponse>
  label?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  className?: string
  confirmTitle?: string
  confirmDescription?: string
  confirmActionLabel?: string
}

export function DeleteButton({
  id,
  onDelete,
  label,
  variant = 'ghost',
  className,
  confirmTitle = 'Tem certeza?',
  confirmDescription = 'Esta acao nao pode ser desfeita.',
  confirmActionLabel = 'Confirmar exclusao',
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = () => {
    startTransition(async () => {
      const result = await onDelete(id)
      if (!result.success) {
        toast.error(result.message)
      }
      setShowConfirm(false)
    })
  }

  return (
    <>
      <Button
        variant={variant}
        size={label ? 'sm' : 'icon'}
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        aria-label={label || 'Excluir item'}
        className={className}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        {label && <span className="ml-2 font-medium">{label}</span>}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {confirmActionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
