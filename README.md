# Jason FX Academy — jasonfxacademy.com

Lead-generation landing page for Jason FX Academy, built from the Caplix
Market website and the Wick Theory film.

- **Design:** Roboto, navy + gold, Bootstrap Icons only, no emoji.
- **Video:** the full Wick Theory film (1 min 40 sec) is embedded in the hero
  and in the story section — `assets/video/wick-theory.mp4`.
- **Lead form:** name, email, WhatsApp, experience, market, country.
  Posts to `POST /api/lead` and emails the lead to you via Gmail.
- **Hosting:** Cloudflare Pages (static site + Pages Function).

## Structure

```
index.html                  Landing page
assets/css/style.css        All styling
assets/js/main.js           Form submit, FAQ accordion
assets/video/wick-theory.mp4  The film
assets/img/poster.jpg       Film poster (Dubai skyline frame)
functions/api/lead.js       Cloudflare Pages Function — Gmail API
api/lead.php                Classic Gmail SMTP endpoint (PHP hosts only)
api/config.example.php      Copy to config.php — never commit the real one
GMAIL_SETUP.md              Gmail + custom domain setup, step by step
```

## Run locally

```bash
npx serve .
# or
python3 -m http.server 8000
```

The form will return `lead_inbox_not_configured` locally until the Gmail
variables are set — that is by design, so a lead is never silently lost.

## Deploy

Cloudflare Pages project `jason-fx-academy`, connected to
`AnointingPaschal/jason-fx-academy`, branch `main`, build command empty,
output directory `/` (root). See `GMAIL_SETUP.md` for the Gmail variables
and for connecting `jasonfxacademy.com`.

## Risk note

Education only, not financial advice. Trading involves substantial risk of
loss. Past performance does not guarantee future results. Results shown in
the film are not typical.
