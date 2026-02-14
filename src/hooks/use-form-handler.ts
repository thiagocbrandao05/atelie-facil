'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { ActionResponse } from '@/lib/types'

export function useFormHandler<T>(
  action: (prevState: ActionResponse<T>, formData: FormData) => Promise<ActionResponse<T>>,
  initialState: ActionResponse<T> = { success: false, message: '' },
  onSuccess?: (state: ActionResponse<T>) => void
) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(action, initialState)

  const prevPending = useRef(isPending)

  useEffect(() => {
    // Only trigger if we just finished loading (was pending, now not) AND it was successful
    if (prevPending.current && !isPending && state.success) {
      setOpen(false)
      onSuccess?.(state)
    }
    prevPending.current = isPending
  }, [isPending, state, onSuccess])

  return {
    open,
    setOpen,
    state,
    formAction,
    isPending,
  }
}
