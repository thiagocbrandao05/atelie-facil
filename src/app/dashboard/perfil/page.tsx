import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Meu Perfil</h1>
                    <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais e de acesso.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">

                {/* User Card */}
                <Card className="h-fit">
                    <CardHeader className="text-center pb-2">
                        <div className="w-24 h-24 bg-primary rounded-full mx-auto flex items-center justify-center text-4xl text-primary-foreground font-bold shadow-lg mb-4">
                            {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <CardTitle>{user.name || "Usuário"}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                            <Shield size={18} className="text-primary" />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">Plano Premium</span>
                                <span className="text-xs text-muted-foreground">Ativo até Dez/2026</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informações Básicas</CardTitle>
                        <CardDescription>Atualize seus dados de identificação.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProfileForm user={{
                            name: user.name || null,
                            email: user.email || ""
                        }} />
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}

