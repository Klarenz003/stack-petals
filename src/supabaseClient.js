// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY')

export default supabase