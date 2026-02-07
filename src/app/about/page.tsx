import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#F5F4F0]">
            <header className="fixed top-0 w-full z-50 bg-[#455448]/90 backdrop-blur-md border-b border-white/10 shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#9C4A2F] flex items-center justify-center text-white font-bold shadow-lg">
                                A
                            </div>
                            <span className="font-bold text-xl tracking-tight text-white">
                                AteliêFácil
                            </span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-16 container mx-auto px-4 max-w-4xl text-[#455448]">
                <Link href="/" className="inline-flex items-center gap-2 mb-8 text-[#455448]/60 hover:text-[#455448] font-bold transition-colors">
                    <ArrowLeft size={16} />
                    <span>Voltar ao início</span>
                </Link>

                <h1 className="text-5xl font-black mb-8 tracking-tighter">Sobre o AteliêFácil</h1>

                <div className="space-y-8 text-lg font-medium leading-relaxed">
                    <p>
                        O <strong className="font-black">AteliêFácil</strong> nasceu da necessidade de simplificar a gestão de pequenos ateliês e negócios criativos.
                        Sabemos que quem trabalha com artesanato e produção manual muitas vezes perde horas preciosas tentando organizar pedidos,
                        calcular custos e gerenciar o estoque.
                    </p>

                    <p>
                        Nossa missão é devolver esse tempo para você, automatizando a parte burocrática para que você possa focar no que realmente importa: <strong className="font-black text-[#9C4A2F]">criar</strong>.
                    </p>

                    <h2 className="text-3xl font-black mt-16 mb-6 tracking-tight">O que oferecemos?</h2>
                    <ul className="space-y-4">
                        {[
                            "Controle total de estoque de materiais",
                            "Gestão de pedidos e prazos de entrega",
                            "Precificação automática baseada em custos e margem de lucro",
                            "Cadastro de clientes e histórico de compras",
                            "Relatórios simples para entender a saúde do seu negócio"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-[#9C4A2F]" />
                                {item}
                            </li>
                        ))}
                    </ul>

                    <p className="mt-12 pt-12 border-t border-[#455448]/10 text-[#455448]/60 italic font-bold">
                        Desenvolvido com carinho para artesãos que querem profissionalizar seu negócio sem perder a essência da arte.
                    </p>
                </div>
            </main>
        </div>
    )
}


