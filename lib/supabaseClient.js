import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ถ้าค่า URL หรือ Key ว่างเปล่า createClient จะพังทันที
export const supabase = createClient(supabaseUrl, supabaseKey)