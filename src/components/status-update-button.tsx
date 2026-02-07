'use client'

import { useTransition } from 'react'
import { updateOrderStatus } from '@/features/orders/actions'
import { Button } from '@/components/ui/button'
import { PlusCircle, Loader2 } from 'lucide-react'

export function StatusUpdateButton({ id, status, label }: { id: string, status: string, label: string }) {
    const [isPending, startTransition] = useTransition()

    const handleUpdate = () => {
        startTransition(async () => {
            const result = await updateOrderStatus(id, status)
            if (!result.success) {
                alert(result.message)
            }
        })
    }

    return (
        <Button
            size="sm"
            onClick={handleUpdate}
            disabled={isPending}
            className="flex items-center gap-1 h-7 px-2"
        >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3 w-3" />}
            {label}
        </Button>
    )
}


