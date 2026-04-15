const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { name, email, phone, country, message } = await req.json()
    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Blissful Sleep Solutions <onboarding@resend.dev>',
        to: ['info@blissfulsleepsolutions.com.au'],
        reply_to: email,
        subject: `New enquiry from ${name}`,
        html: `
          <h2>New contact form submission</h2>
          <table cellpadding="8" style="border-collapse:collapse;width:100%">
            <tr><td style="font-weight:bold;width:120px">Name</td><td>${name}</td></tr>
            <tr><td style="font-weight:bold">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
            ${phone ? `<tr><td style="font-weight:bold">Phone</td><td>${phone}</td></tr>` : ''}
            ${country ? `<tr><td style="font-weight:bold">Country</td><td>${country}</td></tr>` : ''}
            ${message ? `<tr><td style="font-weight:bold;vertical-align:top">Message</td><td style="white-space:pre-wrap">${message}</td></tr>` : ''}
          </table>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend error: ${err}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
