export function buildWorkspaceAppPath(_workspaceSlug: string, appPath: string): string {
  const normalizedAppPath = appPath.startsWith('/') ? appPath : `/${appPath}`
  return `/app${normalizedAppPath}`
}

export function buildWorkspaceAppPaths(_workspaceSlug: string, appPaths: string[]): string[] {
  return appPaths.map(appPath => buildWorkspaceAppPath('', appPath))
}
