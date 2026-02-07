'use client'

import { useActionState } from "react"
import { updateProfile } from "@/features/settings/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail } from "lucide-react"

const initialState = { success: false, message: '' }

interface ProfileFormProps {
    user: {
        name: string | null
        email: string
    }
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [state, action, isPending] = useActionState(updateProfile, initialState)

    return (
        <form action={action} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="name" name="name" defaultValue={user.name || ""} className="pl-9" required />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" defaultValue={user.email || ""} className="pl-9" required />
                </div>
            </div>

            <div className="flex flex-col items-end gap-2 pt-4">
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                {state?.message && (
                    <p className={`text-sm font-medium ${state.success ? 'text-green-600' : 'text-red-600'}`}>
                        {state.message}
                    </p>
                )}
            </div>
        </form>
    )
}


