# Gmail setup for Jason FX Academy leads

The form on the landing page posts to `POST /api/lead`. That endpoint emails
every lead to you through Gmail. There are two routes — pick the one that
matches where the site is hosted.

## Route A — Cloudflare Pages (this deployment)

Cloudflare Pages Functions cannot open a raw SMTP connection to
`smtp.gmail.com:587`, so this route uses the Gmail API instead. The email
still comes from Gmail and lands in your Gmail inbox.

### 1. Create the Gmail API credentials (once, 10 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project, e.g. `jason-fx-academy`.
2. APIs & Services > Library > enable **Gmail API**.
3. APIs & Services > Credentials > Create Credentials > **OAuth client ID** > Desktop app.
4. Note the **Client ID** and **Client secret**.
5. Get a refresh token. The quickest way is Google's OAuth Playground:
   - Go to https://developers.google.com/oauthplayground/
   - Settings (gear, top right) > check **Use your own OAuth credentials**, paste your Client ID and secret.
   - In the scope list, select `https://www.googleapis.com/auth/gmail.send`.
   - Authorize with the Gmail account that will send the leads, exchange the code, and copy the **Refresh token**.

### 2. Add the secrets to Cloudflare Pages

Cloudflare Dashboard > Workers & Pages > `jason-fx-academy` > Settings > Variables and Secrets > Add:

| Variable | Value |
|---|---|
| `GMAIL_CLIENT_ID` | from step 1 |
| `GMAIL_CLIENT_SECRET` | from step 1 |
| `GMAIL_REFRESH_TOKEN` | from step 1 |
| `LEAD_TO_EMAIL` | the Gmail inbox that receives leads, e.g. `you@gmail.com` |
| `GMAIL_FROM` | optional, defaults to `LEAD_TO_EMAIL` |

Redeploy after adding them (Deployments > Retry deployment, or push any commit).

### 3. Test

Fill in the form on the live site. You should get an email with the subject
`New Jason FX Academy lead — <name>` within a minute, with Reply-To set to
the lead's email so you can reply in one click.

If the form says "Lead inbox not connected yet", one of the four variables
above is missing — that is the function refusing to pretend the lead was sent.

## Route B — Classic Gmail SMTP (PHP hosting only)

Use this if you ever move the site to cPanel / any PHP host. It does **not**
run on Cloudflare Pages.

1. In Gmail, turn on 2-Step Verification, then create an **App Password**:
   Google Account > Security > 2-Step Verification > App passwords > Mail.
   Copy the 16-character password.
2. On the PHP host: `composer require phpmailer/phpmailer`
3. Copy `api/config.example.php` to `api/config.php` and fill in `GMAIL_USER`,
   `GMAIL_APP_PASSWORD` (the App Password, no spaces) and `LEAD_TO_EMAIL`.
4. Point the form at `/api/lead.php` instead of `/api/lead`
   (in `assets/js/main.js`, change `fetch('/api/lead'` to `fetch('/api/lead.php'`).
5. Test the form. Gmail SMTP is `smtp.gmail.com`, port 587, STARTTLS.

Never commit `api/config.php`, and never use your normal Gmail password —
only an App Password, and only on the PHP route.

## Custom domain — jasonfxacademy.com

1. Buy / point the domain's DNS to Cloudflare (or add it in Cloudflare first).
2. Cloudflare Dashboard > Workers & Pages > `jason-fx-academy` > Custom domains > Set up a custom domain > `jasonfxacademy.com` (and `www.jasonfxacademy.com`).
3. Cloudflare adds the DNS records automatically if the domain is on Cloudflare DNS. Wait for the certificate to issue, then the site is live at https://jasonfxacademy.com.
