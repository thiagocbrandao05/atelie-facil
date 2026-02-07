import { getSettings } from "@/features/settings/actions";
import dynamic from "next/dynamic";

const SettingsForm = dynamic(() => import("@/components/settings-form").then(mod => mod.SettingsForm), {
    loading: () => <div className="p-8 text-center">Carregando formulário...</div>
});

export default async function SettingsPage() {
    const settings = await getSettings();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
                    <p className="text-muted-foreground mt-1">Personalize sua loja e preferências do sistema.</p>
                </div>
            </div>

            <SettingsForm settings={settings} />
        </div>
    )
}


