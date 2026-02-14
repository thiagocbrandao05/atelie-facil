
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Erro: Variáveis de ambiente não encontradas.')
    console.error('Certifique-se de que .env.local contém NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function promoteToAdmin(email: string) {
    console.log(`🔍 Buscando usuário: ${email}...`)

    // 1. Check if user exists in Auth (optional, but good for verification)
    // We'll skip strict Auth check and go straight to DB for simplicity, 
    // as the User table is our source of truth for 'role'.

    // 2. Update User table
    const { data, error } = await supabase
        .from('User')
        .update({ role: 'SUPER_ADMIN' })
        .eq('email', email)
        .select()

    if (error) {
        console.error('❌ Erro ao atualizar usuário:', error.message)
        process.exit(1)
    }

    if (!data || data.length === 0) {
        console.error('❌ Usuário não encontrado no banco de dados.')
        console.log('Dica: O usuário precisa fazer login pelo menos uma vez para existir na tabela "User".')
        process.exit(1)
    }

    console.log('✅ Sucesso! Usuário promovido a SUPER_ADMIN.')
    console.log('------------------------------------------------')
    console.log(`Nome: ${data[0].name}`)
    console.log(`Email: ${data[0].email}`)
    console.log(`Role: ${data[0].role}`)
    console.log('------------------------------------------------')
}

const email = process.argv[2]

if (!email) {
    console.error('❌ Por favor, forneça o e-mail do usuário.')
    console.log('Uso: npx tsx scripts/promote-admin.ts <email>')
    process.exit(1)
}

promoteToAdmin(email)
