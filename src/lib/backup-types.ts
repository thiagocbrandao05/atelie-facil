// Backup data types
export interface BackupData {
    version: string
    timestamp: string
    data: {
        customers: any[]
        materials: any[]
        products: any[]
        orders: any[]
        suppliers?: any[]
        movements?: any[]
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


