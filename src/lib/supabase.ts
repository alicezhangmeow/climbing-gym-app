import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const fallbackUrl = 'https://stcchyzlzsionmcptlea.supabase.co'
const fallbackAnonKey =
  'sb_publishable_DeC08b6FIg3r-0Z5E_Zx7Q_4tYNXgqj'

const url = envUrl ?? fallbackUrl
const anonKey = envAnonKey ?? fallbackAnonKey

export const supabase =
  url && anonKey ? createClient(url, anonKey) : undefined

