export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <div className="text-6xl">📡</div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Você está offline
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Não foi possível conectar à internet. Verifique sua conexão e tente novamente.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg space-y-4">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                        Enquanto isso, você pode:
                    </h2>
                    <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Visualizar dados em cache</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Acessar páginas visitadas recentemente</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-500">⚠</span>
                            <span>Alterações serão sincronizadas quando voltar online</span>
                        </li>
                    </ul>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                    Tentar novamente
                </button>
            </div>
        </div>
    )
}


