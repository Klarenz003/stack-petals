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
      .select('role, admin_market')
      .eq('id', userData.user.id)
      .maybeSingle()

    if (adminProfileError) throw adminProfileError

    if (adminProfile?.role !== 'admin' || adminProfile.admin_market !== 'ALL') {
      return json({ error: 'Only the Stack Petals owner can create account access.' }, 403)
    }

    const body = await req.json()
    const fullName = String(body.fullName || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const phone = String(body.phone || '').trim()
    const password = String(body.password || '')
    const accountType = body.accountType === 'admin' ? 'admin' : 'investor'
    const adminMarket = accountType === 'admin' ? String(body.adminMarket || '').toUpperCase() : null

    if (!fullName) return json({ error: 'Account name is required.' }, 400)
    if (!email) return json({ error: 'Account email is required.' }, 400)
    if (password.length < 8) return json({ error: 'Password must be at least 8 characters.' }, 400)
    if (accountType === 'admin' && !['PH', 'CA'].includes(adminMarket || '')) {
      return json({ error: 'Choose Philippines or Canada for this admin account.' }, 400)
    }

    const authUserPayload = {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
        account_type: accountType,
        admin_market: adminMarket,
      },
    }

    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser(authUserPayload)
    let authUser = createdUser.user
    let restored = false

    if (createUserError) {
      const alreadyRegistered = /already (been )?registered|already exists/i.test(createUserError.message || '')
      if (!alreadyRegistered) throw createUserError

      const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })
      if (usersError) throw usersError

      authUser = usersData.users.find(user => user.email?.toLowerCase() === email)
      if (!authUser) throw new Error('This email exists in Authentication but could not be restored automatically.')

      const { data: updatedUser, error: updateUserError } = await adminClient.auth.admin.updateUserById(
        authUser.id,
        { password, user_metadata: authUserPayload.user_metadata },
      )
      if (updateUserError) throw updateUserError
      authUser = updatedUser.user
      restored = true
    }

    if (!authUser?.id) throw new Error('The Auth user could not be created or restored.')

    const { error: profileError } = await adminClient.from('investor_profiles').upsert({
      id: authUser.id,
      full_name: fullName,
      email,
      phone,
      role: accountType,
      admin_market: adminMarket,
      updated_at: new Date().toISOString(),
    })

    if (profileError) throw profileError

    return json({ userId: authUser.id, restored })
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
