import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lbyyjdavahhfrnerhavt.supabase.co'
const SUPABASE_KEY = 'sb_publishable_cNBoBPmTQEKNHUdCt3z-HA_9un3lIc7'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)