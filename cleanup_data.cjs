const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const fs = require('fs')

const envPath = '.env.local'
const envContent = fs.readFileSync(envPath, 'utf8')
const envConfig = dotenv.parse(envContent)

const supabaseUrl = envConfig.VITE_SUPABASE_URL
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY

// Note: Using the anon key might fail if RLS policies prevent deletion.
// However, in this project, we've typically worked with more permissive settings or the user's direct environment.
const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanup() {
  console.log("🚀 Starting cleanup process...")

  // Delete Receipts
  console.log("🗑️ Clearing receipts...")
  const { error: e1 } = await supabase.from('receipts').delete().neq('id', '00000000-0000-0000-0000-000000000000') // delete all
  if (e1) console.error("❌ Error clearing receipts:", e1.message)
  else console.log("✅ Receipts cleared.")

  // Delete Budgets
  console.log("🗑️ Clearing budgets...")
  const { error: e2 } = await supabase.from('budgets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (e2) console.error("❌ Error clearing budgets:", e2.message)
  else console.log("✅ Budgets cleared.")

  // Delete Work Orders
  console.log("🗑️ Clearing work orders...")
  const { error: e3 } = await supabase.from('work_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (e3) console.error("❌ Error clearing work orders:", e3.message)
  else console.log("✅ Work orders cleared.")

  console.log("✨ Cleanup finished.")
}

cleanup()
