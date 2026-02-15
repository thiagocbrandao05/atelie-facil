import { redirect } from 'next/navigation'

export default async function LegacyWorkspaceOnboardingPage() {
  redirect('/app/onboarding')
}
