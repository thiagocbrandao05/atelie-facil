import { redirect } from 'next/navigation'

export default async function LegacyWorkspaceAppPage() {
  redirect('/app/dashboard')
}
