import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Investor access function is missing Supabase environment variables.')
    }

    const authHeader = req.headers.get('Authorization') || ''
    const authedClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: userData, error: userError } = await authedClient.auth.getUser()
    if (userError || !userData.user) {
      return json({ error: 'Admin login is required.' }, 401)
    }

    const { data: adminProfile, error: adminProfileError } = await adminClient
      .from('investor_profiles')
      .select('role')
      .eq('id', userData.user.id)
      .maybeSingle()

    if (adminProfileError) throw adminProfileError

    if (adminProfile?.role !== 'admin') {
      return json({ error: 'Only investor admins can create investor access.' }, 403)
    }

    const body = await req.json()
    const fullName = String(body.fullName || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const phone = String(body.phone || '').trim()
    const password = String(body.password || '')

    if (!fullName) return json({ error: 'Investor name is required.' }, 400)
    if (!email) return json({ error: 'Investor email is required.' }, 400)
    if (password.length < 8) return json({ error: 'Password must be at least 8 characters.' }, 400)

    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
      },
    })

    if (createUserError) throw createUserError
    if (!createdUser.user?.id) throw new Error('Investor Auth user was not created.')

    const { error: profileError } = await adminClient.from('investor_profiles').upsert({
      id: createdUser.user.id,
      full_name: fullName,
      email,
      phone,
      role: 'investor',
      updated_at: new Date().toISOString(),
    })

    if (profileError) throw profileError

    return json({ userId: createdUser.user.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create investor access.'
    return json({ error: message }, 400)
  }
})

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
