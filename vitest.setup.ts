import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mocking Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => '/',
}))

// Mocking Next.js cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

// Mocking Prisma to avoid DB connections during unit tests
vi.mock('@/lib/prisma', () => ({
    prisma: {
        material: {
            findMany: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        },
        product: {
            findMany: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        },
        order: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        },
        productMaterial: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
        },
        orderItem: {
            findMany: vi.fn(),
        },
        customer: {
            findMany: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
        },
        $transaction: vi.fn(async (cb) => {
            const tx = {
                product: {
                    update: vi.fn(),
                    delete: vi.fn(),
                },
                productMaterial: {
                    deleteMany: vi.fn(),
                    createMany: vi.fn(),
                },
                material: {
                    update: vi.fn(),
                },
            }
            return await cb(tx)
        }),
    },
}))

