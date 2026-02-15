import { revalidatePath } from 'next/cache'

import { buildWorkspaceAppPaths } from '@/lib/workspace-path'

export function revalidateWorkspaceAppPaths(workspaceSlug: string, appPaths: string[]): void {
  for (const path of buildWorkspaceAppPaths(workspaceSlug, appPaths)) {
    revalidatePath(path)
  }
}
