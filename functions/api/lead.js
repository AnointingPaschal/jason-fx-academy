/**
 * Jason FX Academy — lead form endpoint for Cloudflare Pages.
 * POST /api/lead  { name, email, whatsapp, experience, market, country }
 *
 * Why Gmail API here, not raw SMTP:
 * Cloudflare Pages Functions run on the Workers runtime, which does not
 * allow a direct outbound TCP connection to smtp.gmail.com:587.
 * So on Cloudflare the Gmail-native route is the Gmail API:
 *  1. Exchange a Gmail OAuth2 refresh token for an access token.
 *  2. Send the lead as a Gmail message (users.messages.send).
 * The email still comes from, and lands in, Gmail.
 *
 * Required Pages environment variables (Dashboard > Pages > Settings > Variables):
 *   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
 *   LEAD_TO_EMAIL   — inbox that receives leads, e.g. you@gmail.com
 *   GMAIL_FROM      — optional, defaults to LEAD_TO_EMAIL
 *
 * Classic SMTP is in /api/lead.php (PHPMailer, smtp.gmail.com:587 + App Password)
 * for any PHP host. See GMAIL_SETUP.md for both routes.
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function base64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function onRequestPost(context) {
  const { env } = context;
  let body = {};
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json', message: 'Please send the form again.' }, 400);
  }

  // Honeypot — bots fill this, humans never see it.
  if (body.website) return json({ ok: true, message: 'Received.' });

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const whatsapp = String(body.whatsapp || '').trim();
  const telegram = String(body.telegram || '').trim();
  const experience = String(body.experience || '').trim();
  const market = String(body.market || '').trim();
  const country = String(body.country || '').trim();

  if (name.length < 2) return json({ ok: false, error: 'invalid_name', message: 'Please add your full name.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'invalid_email', message: 'Please add a valid email address.' }, 400);
  }
  if (name.length > 120 || email.length > 120) {
    return json({ ok: false, error: 'too_long', message: 'Name or email is too long.' }, 400);
  }

  const to = env.LEAD_TO_EMAIL;
  if (!env.GMAIL_CLIENT_ID || !env.GMAIL_CLIENT_SECRET || !env.GMAIL_REFRESH_TOKEN || !to) {
    // Honest failure: do not pretend the lead was delivered.
    return json({
      ok: false,
      error: 'lead_inbox_not_configured',
      message: 'Lead inbox not connected yet. Add GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN and LEAD_TO_EMAIL in Cloudflare Pages > Settings > Variables — see GMAIL_SETUP.md.',
    }, 503);
  }

  const from = env.GMAIL_FROM || to;
  const subject = `New Jason FX Academy lead — ${name}`;
  const text = [
    'New lead from jasonfxacademy.com',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `WhatsApp: ${whatsapp || '—'}`,
    `Telegram: ${telegram || '—'}`,
    `Experience: ${experience || '—'}`,
    `Wants to trade: ${market || '—'}`,
    `Country: ${country || '—'}`,
    `Source: ${body.source || 'Jason FX Academy landing page'}`,
    `Time: ${new Date().toISOString()}`,
    '',
    `Reply to the lead at: ${email}`,
  ].join('\n');

  const html = `
    <h2 style="font-family:Roboto,Arial,sans-serif">New Jason FX Academy lead</h2>
    <table style="font-family:Roboto,Arial,sans-serif;font-size:15px" cellpadding="6">
      <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
      <tr><td><strong>Email</strong></td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      <tr><td><strong>WhatsApp</strong></td><td>${escapeHtml(whatsapp || '—')}</td></tr>
      <tr><td><strong>Telegram</strong></td><td>${escapeHtml(telegram || '—')}</td></tr>
      <tr><td><strong>Experience</strong></td><td>${escapeHtml(experience || '—')}</td></tr>
      <tr><td><strong>Wants to trade</strong></td><td>${escapeHtml(market || '—')}</td></tr>
      <tr><td><strong>Country</strong></td><td>${escapeHtml(country || '—')}</td></tr>
      <tr><td><strong>Source</strong></td><td>${escapeHtml(body.source || 'Jason FX Academy landing page')}</td></tr>
    </table>
    <p style="font-family:Roboto,Arial,sans-serif;color:#666">Reply to this lead at ${escapeHtml(email)}.</p>
  `;

  try {
    // 1. OAuth2: refresh token -> access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GMAIL_CLIENT_ID,
        client_secret: env.GMAIL_CLIENT_SECRET,
        refresh_token: env.GMAIL_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });
    const token = await tokenRes.json();
    if (!tokenRes.ok || !token.access_token) {
      return json({ ok: false, error: 'gmail_auth_failed', message: 'Gmail connection failed. Check the Gmail API credentials in Cloudflare.' }, 502);
    }

    // 2. Gmail API: send message
    const raw = [
      `From: ${from}`,
      `To: ${to}`,
      `Reply-To: ${email}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      '',
      html,
    ].join('\r\n');

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: base64Url(raw) }),
    });
    const sent = await sendRes.json();
    if (!sendRes.ok) {
      return json({ ok: false, error: 'gmail_send_failed', message: 'Gmail could not send the lead email. Please try again.' }, 502);
    }

    return json({ ok: true, message: 'Lead sent.', id: sent.id || null });
  } catch (e) {
    return json({ ok: false, error: 'send_error', message: 'The lead could not be sent. Please try again in a moment.' }, 502);
  }
}
