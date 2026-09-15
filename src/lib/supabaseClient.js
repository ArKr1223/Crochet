import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured =
  Boolean(supabaseUrl) && Boolean(supabasePublishableKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, { global: { fetch: storageFetch } })
  : null

async function storageFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : input.url
  if (!url?.includes('/storage/v1/')) return fetch(input, init)
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (init.signal?.aborted) abort()
  init.signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(abort, 90000)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (controller.signal.aborted) throw new Error('照片傳輸逾時，請檢查網路後重試。')
    throw error
  } finally {
    clearTimeout(timer)
    init.signal?.removeEventListener('abort', abort)
  }
}
