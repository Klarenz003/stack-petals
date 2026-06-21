import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL    = Deno.env.get('ADMIN_EMAIL')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { order } = await req.json()

  // Email to admin
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    'onboarding@resend.dev',
      to:      ADMIN_EMAIL,
      subject: `🌸 New Order from ${order.customer_name}`,
      html: `
        <h2>New Order Received</h2>
        <p><strong>Customer:</strong> ${order.customer_name}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>Delivery Date:</strong> ${order.delivery_date}</p>
        <p><strong>Total:</strong> ${order.total}</p>
        <p><strong>Payment:</strong> ${order.payment_method}</p>
        <p><strong>Note:</strong> ${order.note || '—'}</p>
        <h3>Items:</h3>
        <ul>
          ${order.items.map((i: any) => `<li>${i.name} — ${i.price}</li>`).join('')}
        </ul>
      `,
    }),
  })

  // Confirmation email to customer
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    'onboarding@resend.dev',
      to:      order.email,
      subject: '🌷 Your Stack Petals Order has been received!',
      html: `
        <h2>Thank you, ${order.customer_name}! 🌸</h2>
        <p>We've received your order and are reviewing your payment.</p>
        <h3>Order Summary:</h3>
        <ul>
          ${order.items.map((i: any) => `<li>${i.name} — ${i.price}</li>`).join('')}
        </ul>
        <p><strong>Total:</strong> ${order.total}</p>
        <p><strong>Delivery Date:</strong> ${order.delivery_date}</p>
        <p><strong>Delivery Address:</strong> ${order.address}</p>
        <p>We'll confirm your order within 24 hours. 🌷</p>
        <br/>
        <p>With love,<br/>Stack Petals 🌸</p>
      `,
    }),
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})