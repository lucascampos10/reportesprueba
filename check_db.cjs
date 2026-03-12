const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const fs = require('fs')

const envPath = '.env.local'
const envContent = fs.readFileSync(envPath, 'utf8')
const envConfig = dotenv.parse(envContent)

const supabaseUrl = envConfig.VITE_SUPABASE_URL
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log("Fetching budgets...")
  const { data: budgets, error: e1 } = await supabase.from('budgets').select('id, budget_number, order_id, status, building')
  if (e1) console.error(e1)
  
  console.log("Fetching orders...")
  const { data: orders, error: e2 } = await supabase.from('work_orders').select('id, budget_status, title, status')
  if (e2) console.error(e2)

  console.log("=== BUDGETS WITH ORDER_ID ===")
  const linkedBudgets = budgets.filter(b => b.order_id)
  console.table(linkedBudgets.slice(0, 5))

  console.log("=== ORDERS WITH BUDGET_STATUS ===")
  const ordersWithStatus = orders.filter(o => o.budget_status)
  console.table(ordersWithStatus.slice(0, 10))
  
  console.log(`\nLinked Budgets: ${linkedBudgets.length} out of ${budgets.length}`)
  console.log(`Orders with explicitly set budget_status: ${ordersWithStatus.length} out of ${orders.length}`)
}

run()
