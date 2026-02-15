// Backup data types
export interface BackupData {
  version: string
  timestamp: string
  data: {
    customers: unknown[]
    materials: unknown[]
    products: unknown[]
    orders: unknown[]
    suppliers?: unknown[]
    movements?: unknown[]
  }
}

export interface BackupMetadata {
  version: string
  timestamp: string
  recordCounts: {
    customers: number
    materials: number
    products: number
    orders: number
    suppliers: number
    movements: number
  }
}
