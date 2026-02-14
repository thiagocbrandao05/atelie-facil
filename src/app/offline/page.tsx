export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-6xl">📡</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Você está offline</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Não foi possível conectar à internet. Verifique sua conexão e tente novamente.
          </p>
        </div>

        <div className="space-y-4 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Enquanto isso, você pode:</h2>
          <ul className="space-y-2 text-left text-sm text-gray-600 dark:text-gray-400">
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
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
