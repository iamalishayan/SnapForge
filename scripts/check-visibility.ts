import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: 'apps/admin/.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function check() {
  const { data, error } = await supabase
    .from('translations')
    .select('*, site_configs!inner(domain), articles!inner(templates!inner(slug))')
    .eq('status', 'qa_approved')
  
  console.log(JSON.stringify(data, null, 2))
}
check()
