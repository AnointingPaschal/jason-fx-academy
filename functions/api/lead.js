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
  // Subject is plain ASCII only: a non-ASCII dash in the header came
  // through as mojibake (aEUR") in Gmail, so no em dashes here.
  const subject = `New lead: ${name} - Jason FX Academy`;
  const row = (label, value) => `<tr><td style="padding:11px 14px;color:#667085;font-size:14px;border-bottom:1px solid #eaecf0;width:38%">${label}</td><td style="padding:11px 14px;color:#101828;font-size:14px;font-weight:500;border-bottom:1px solid #eaecf0">${value}</td></tr>`;
  const html = `
  <div style="font-family:Roboto,Arial,sans-serif;background:#f9fafb;padding:24px 12px">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eaecf0">
      <div style="background:#101828;padding:24px 24px 20px;text-align:center">
        <div style="display:inline-block;background:#d9a441;color:#101828;font-weight:900;font-size:22px;width:44px;height:44px;line-height:44px;border-radius:10px">J</div>
        <div style="color:#ffffff;font-size:20px;font-weight:900;letter-spacing:.02em;margin-top:10px">JASON FX ACADEMY</div>
        <div style="color:#d9a441;font-size:12px;letter-spacing:.18em;margin-top:4px">NEW LEAD &bull; THE WICK ROOM</div>
      </div>
      <div style="height:3px;background:linear-gradient(90deg,#d9a441,#f0d47a,#d9a441)"></div>
      <div style="padding:24px">
        <h2 style="margin:0 0 4px;font-size:20px;color:#101828">A new person wants us to trade for them</h2>
        <p style="margin:0 0 18px;font-size:14px;color:#667085">Someone just registered on jasonfxacademy.com. Reach out fast while they are warm.</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eaecf0;border-radius:10px;overflow:hidden" cellpadding="0" cellspacing="0">
          ${row('Full name', escapeHtml(name))}
          ${row('Email', `<a href="mailto:${escapeHtml(email)}" style="color:#175cd3;text-decoration:none">${escapeHtml(email)}</a>`)}
          ${row('WhatsApp', escapeHtml(whatsapp || 'Not given'))}
          ${row('Telegram', escapeHtml(telegram || 'Not given'))}
          ${row('Experience', escapeHtml(experience || 'Not given'))}
          ${row('Country', escapeHtml(country || 'Not given'))}
          ${row('Registered', new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET')}
        </table>
        <div style="text-align:center;margin-top:22px">
          <a href="mailto:${escapeHtml(email)}" style="display:inline-block;background:#101828;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 28px;border-radius:999px">Reply to ${escapeHtml(name.split(' ')[0])}</a>
        </div>
        <p style="text-align:center;font-size:12px;color:#98a2b3;margin:16px 0 0">WhatsApp: ${escapeHtml(whatsapp || 'not given')} &nbsp;|&nbsp; Telegram: ${escapeHtml(telegram || 'not given')}</p>
      </div>
      <div style="background:#f9fafb;padding:14px 24px;text-align:center;font-size:11px;color:#98a2b3;border-top:1px solid #eaecf0">Jason FX Academy &bull; jasonfxacademy.com &bull; Trading involves risk. No guaranteed profits.</div>
    </div>
  </div>`;

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
