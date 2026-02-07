'use client'

import { useState, useActionState, useEffect } from 'react'
import { ActionResponse } from '@/lib/types'

export function useFormHandler<T>(
    action: (prevState: ActionResponse<T>, formData: FormData) => Promise<ActionResponse<T>>,
    initialState: ActionResponse<T> = { success: false, message: '' },
    onSuccess?: (data?: T) => void
) {
    const [open, setOpen] = useState(false)
    const [state, formAction, isPending] = useActionState(action, initialState)

    useEffect(() => {
        if (state.success) {
            const timer = setTimeout(() => {
                setOpen(false)
                onSuccess?.(state.data)
            }, 500) // Small delay for user to see success message
            return () => clearTimeout(timer)
        }
    }, [state.success, state.data, onSuccess])

    return {
        open,
        setOpen,
        state,
        formAction,
        isPending
    }
}


