'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, Ruler } from 'lucide-react'
import { createMeasurement, getMeasurements, deleteMeasurement } from '@/features/measurements/actions'
import { toast } from 'sonner'
import { Card, CardContent } from './ui/card'

export function MeasurementsSection({ customerId }: { customerId: string }) {
    const [measurements, setMeasurements] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchMeasurements = async () => {
        setIsLoading(true)
        const data = await getMeasurements(customerId)
        setMeasurements(data)
        setIsLoading(false)
    }

    useEffect(() => {
        fetchMeasurements()
    }, [customerId])

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const response = await createMeasurement({}, formData)

        if (response.success) {
            toast.success(response.message)
            fetchMeasurements()
                ; (e.target as HTMLFormElement).reset()
        } else {
            toast.error(response.message)
        }
    }

    const handleDelete = async (id: string) => {
        const response = await deleteMeasurement(id)
        if (response.success) {
            toast.success(response.message)
            fetchMeasurements()
        } else {
            toast.error(response.message)
        }
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-xl border border-dashed">
                <input type="hidden" name="customerId" value={customerId} />
                <div className="md:col-span-2 space-y-1">
                    <Label htmlFor="name" className="text-[10px] uppercase font-bold text-muted-foreground">Nome (ex: Busto)</Label>
                    <Input id="name" name="name" placeholder="Medida" required className="h-9" />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="value" className="text-[10px] uppercase font-bold text-muted-foreground">Valor</Label>
                    <Input id="value" name="value" placeholder="85cm" required className="h-9" />
                </div>
                <div className="flex items-end">
                    <Button type="submit" className="w-full h-9 gap-2">
                        <Plus size={16} /> Add
                    </Button>
                </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isLoading ? (
                    <div className="col-span-full py-10 text-center text-muted-foreground animate-pulse">
                        Carregando medidas...
                    </div>
                ) : measurements.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                        Nenhuma medida registrada.
                    </div>
                ) : (
                    measurements.map((m) => (
                        <Card key={m.id} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow group">
                            <CardContent className="p-3 flex justify-between items-center text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-primary">
                                        <Ruler size={14} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">{m.name}</p>
                                        <p className="text-primary font-medium">{m.value}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDelete(m.id)}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
