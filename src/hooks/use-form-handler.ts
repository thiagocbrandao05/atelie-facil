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
  const awaitingResult = useRef(false)
  const onSuccessRef = useRef(onSuccess)

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  useEffect(() => {
    if (!prevPending.current && isPending) {
      // Track explicit submissions; avoid reacting to stale success state.
      awaitingResult.current = true
    }

    prevPending.current = isPending
  }, [isPending])

  useEffect(() => {
    if (isPending || !awaitingResult.current) return

    awaitingResult.current = false
    if (!state.success) return

    setOpen(false)
    onSuccessRef.current?.(state)
  }, [isPending, state])

  return {
    open,
    setOpen,
    state,
    formAction,
    isPending,
  }
}
