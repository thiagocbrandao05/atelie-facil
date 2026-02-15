import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{
    path: string[]
  }>
}

export default async function LegacyWorkspaceAppCatchAllPage({ params }: Props) {
  const { path } = await params
  const appPath = Array.isArray(path) && path.length > 0 ? `/${path.join('/')}` : '/dashboard'
  redirect(`/app${appPath}`)
}
