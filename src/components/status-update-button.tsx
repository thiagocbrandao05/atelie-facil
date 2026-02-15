'use client'

import { useTransition } from 'react'
import { updateOrderStatus } from '@/features/orders/actions'
import { Button } from '@/components/ui/button'
import { PlusCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function StatusUpdateButton({
  id,
  status,
  label,
}: {
  id: string
  status: string
  label: string
}) {
  const [isPending, startTransition] = useTransition()

  const handleUpdate = () => {
    startTransition(async () => {
      const result = await updateOrderStatus(id, status)
      if (!result.success) {
        toast.error(result.message)
      }
    })
  }

  return (
    <Button
      size="sm"
      onClick={handleUpdate}
      disabled={isPending}
      className="flex min-h-10 items-center gap-1.5 px-3 text-xs md:min-h-9"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <PlusCircle className="h-3.5 w-3.5" />
      )}
      {label}
    </Button>
  )
}
