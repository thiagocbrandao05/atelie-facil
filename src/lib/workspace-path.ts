export function buildWorkspaceAppPath(workspaceSlug: string, appPath: string): string {
  const normalizedAppPath = appPath.startsWith('/') ? appPath : `/${appPath}`
  return `/${workspaceSlug}/app${normalizedAppPath}`
}

export function buildWorkspaceAppPaths(workspaceSlug: string, appPaths: string[]): string[] {
  return appPaths.map(appPath => buildWorkspaceAppPath(workspaceSlug, appPath))
}
