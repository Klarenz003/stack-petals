import { supabase } from '@/supabaseClient'
import { forgetAccessSession, readAccessSession, saveAccessSession } from '@/utils/letterAccess'
import type { LetterRecord } from '@/types/letter'

export type AccessResult = { status: 'unlocked' | 'locked' | 'incorrect' | 'limited' | 'unavailable'; letter?: LetterRecord; retry_after?: number; storageUnavailable?: boolean }

export async function unlockLetter(id: string, password?: string, remember = false): Promise<AccessResult> {
  const { data, error } = await supabase.rpc('read_private_letter', {
    p_letter_id: id, p_access_token: readAccessSession(id)?.token ?? null,
    p_password: password ?? null, p_remember: remember,
  })
  if (error) throw error
  if (!data || data.status !== 'unlocked') forgetAccessSession(id)
  if (data?.status === 'unlocked' && data.access_token && data.expires_at) {
    const stored = saveAccessSession(id, { token: data.access_token, expiresAt: data.expires_at }, remember)
    return { status: 'unlocked', letter: data.letter, storageUnavailable: !stored }
  }
  return data ?? { status: 'unavailable' }
}

export async function loadAccessibleLetter(id: string): Promise<AccessResult> {
  // Existing public/admin letters retain their current RLS-controlled reader.
  // Protected rows are absent from this query, including their inline photos.
  const { data, error } = await supabase.from('letters').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (data) return { status: 'unlocked', letter: data }
  return unlockLetter(id)
}
