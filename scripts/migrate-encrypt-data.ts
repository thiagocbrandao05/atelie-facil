/**
 * Data Migration Script: Encrypt existing PII data
 * 
 * Purpose: Migrate existing plaintext phone/email data to encrypted format
 * 
 * Usage:
 * ```bash
 * # Dry run (no actual changes)
 * npx tsx scripts/migrate-encrypt-data.ts --dry-run
 * 
 * # Actual migration
 * npx tsx scripts/migrate-encrypt-data.ts
 * ```
 * 
 * Prerequisites:
 * 1. Run migration SQL first (20260211000000_encrypt_pii.sql)
 * 2. Set DATA_ENCRYPTION_KEY in environment
 * 3. Set SUPABASE_SERVICE_ROLE_KEY for admin access
 */

import { createClient } from '@supabase/supabase-js'
import { encrypt } from '../src/lib/crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL')
    console.error('   SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

if (!process.env.DATA_ENCRYPTION_KEY) {
    console.error('❌ DATA_ENCRYPTION_KEY environment variable is required')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

const DRY_RUN = process.argv.includes('--dry-run')

async function migrateCustomers() {
    console.log('\n📋 Migrating Customer records...')

    const { data: customers, error } = await supabase
        .from('Customer')
        .select('id, phone, email, tenantId')
        .is('phone_encrypted', null) // Only migrate non-encrypted records

    if (error) {
        console.error('❌ Error fetching customers:', error)
        return
    }

    if (!customers || customers.length === 0) {
        console.log('✅ No customers to migrate (all already encrypted)')
        return
    }

    console.log(`   Found ${customers.length} customers to encrypt`)

    let successCount = 0
    let errorCount = 0

    for (const customer of customers) {
        try {
            const phone_encrypted = customer.phone ? encrypt(customer.phone) : null
            const email_encrypted = customer.email ? encrypt(customer.email) : null

            if (DRY_RUN) {
                console.log(
                    `   [DRY RUN] Would encrypt customer ${customer.id} (tenant: ${customer.tenantId})`
                )
            } else {
                const { error: updateError } = await supabase
                    .from('Customer')
                    .update({
                        phone_encrypted,
                        email_encrypted,
                    })
                    .eq('id', customer.id)

                if (updateError) {
                    console.error(`   ❌ Error encrypting customer ${customer.id}:`, updateError)
                    errorCount++
                } else {
                    successCount++
                    if (successCount % 10 === 0) {
                        console.log(`   Progress: ${successCount}/${customers.length} customers encrypted`)
                    }
                }
            }
        } catch (err) {
            console.error(`   ❌ Exception encrypting customer ${customer.id}:`, err)
            errorCount++
        }
    }

    if (DRY_RUN) {
        console.log(`   [DRY RUN] Would encrypt ${customers.length} customers`)
    } else {
        console.log(`   ✅ Encrypted ${successCount} customers`)
        if (errorCount > 0) {
            console.log(`   ⚠️  Failed: ${errorCount} customers`)
        }
    }
}

async function migrateSuppliers() {
    console.log('\n📋 Migrating Supplier records...')

    const { data: suppliers, error } = await supabase
        .from('Supplier')
        .select('id, phone, email, tenantId')
        .is('phone_encrypted', null)

    if (error) {
        console.error('❌ Error fetching suppliers:', error)
        return
    }

    if (!suppliers || suppliers.length === 0) {
        console.log('✅ No suppliers to migrate (all already encrypted)')
        return
    }

    console.log(`   Found ${suppliers.length} suppliers to encrypt`)

    let successCount = 0
    let errorCount = 0

    for (const supplier of suppliers) {
        try {
            const phone_encrypted = supplier.phone ? encrypt(supplier.phone) : null
            const email_encrypted = supplier.email ? encrypt(supplier.email) : null

            if (DRY_RUN) {
                console.log(
                    `   [DRY RUN] Would encrypt supplier ${supplier.id} (tenant: ${supplier.tenantId})`
                )
            } else {
                const { error: updateError } = await supabase
                    .from('Supplier')
                    .update({
                        phone_encrypted,
                        email_encrypted,
                    })
                    .eq('id', supplier.id)

                if (updateError) {
                    console.error(`   ❌ Error encrypting supplier ${supplier.id}:`, updateError)
                    errorCount++
                } else {
                    successCount++
                }
            }
        } catch (err) {
            console.error(`   ❌ Exception encrypting supplier ${supplier.id}:`, err)
            errorCount++
        }
    }

    if (DRY_RUN) {
        console.log(`   [DRY RUN] Would encrypt ${suppliers.length} suppliers`)
    } else {
        console.log(`   ✅ Encrypted ${successCount} suppliers`)
        if (errorCount > 0) {
            console.log(`   ⚠️  Failed: ${errorCount} suppliers`)
        }
    }
}

async function main() {
    console.log('🔐 PII Data Encryption Migration Script')
    console.log('========================================')

    if (DRY_RUN) {
        console.log('⚠️  DRY RUN MODE - No actual changes will be made\n')
    }

    try {
        await migrateCustomers()
        await migrateSuppliers()

        console.log('\n✅ Migration completed successfully!')

        if (!DRY_RUN) {
            console.log('\n📝 Next steps:')
            console.log('   1. Verify encrypted data works correctly in your app')
            console.log('   2. Test for 1-2 weeks in production')
            console.log(
                '   3. After validation, drop original columns: phone, email'
            )
        }
    } catch (error) {
        console.error('\n❌ Migration failed:', error)
        process.exit(1)
    }
}

main()
