# Deploy via GitHub Actions (no dashboard sign-in needed)

This is the deployment route for Jason FX Academy. GitHub's servers talk
to Cloudflare directly, so it does not need Muse's browser or Muse's
Cloudflare API tool.

The workflow is already in the repo at `.github/workflows/deploy.yml`.
It runs on every push to `main`, and it can also be run by hand.
It deploys the repo root (`.`) as the Cloudflare Pages project
`jason-fx-academy`, including the `functions/` folder for the lead form.

## What you need to add (once, 5 minutes)

Two secrets in the GitHub repo. Never paste them in chat, and never
commit them to the repo.

### 1. Your Cloudflare Account ID

1. Sign in to Cloudflare in your own browser: https://dash.cloudflare.com
2. On the Account Home page, look in the right-hand sidebar for
   **Account ID**. Copy it.

### 2. A Cloudflare API token

1. In Cloudflare, go to **My Profile > API Tokens** (top-right avatar).
2. **Create Token > Edit Cloudflare Workers** template.
   (That template covers Pages deployments. If you build a custom token
   instead, give it: Account — Cloudflare Pages — Edit, and
   Account — Workers Scripts — Edit.)
3. Under **Account Resources**, choose your account, then
   **Continue to summary > Create Token**.
4. Copy the token **now** — Cloudflare only shows it once.

## Add the secrets to GitHub

1. Go to https://github.com/AnointingPaschal/jason-fx-academy/settings/secrets/actions
2. **New repository secret**, name exactly:
   - `CLOUDFLARE_API_TOKEN` — paste the API token
   - `CLOUDFLARE_ACCOUNT_ID` — paste the Account ID
3. Save each one.

## Run the deployment

- **Automatic:** the workflow already ran when the workflow file was
  pushed — but it will have failed until the two secrets above exist.
  After adding them, push any small change, or:
- **By hand:** GitHub repo > **Actions** > **Deploy to Cloudflare Pages**
  > **Run workflow** > branch `main` > **Run workflow**.

Watch the run in the Actions tab. When it is green, the site is live at:

**https://jason-fx-academy.pages.dev**

Every later push to `main` redeploys automatically.

## If the run fails

- `Authentication error` / `Invalid token` — the API token is wrong,
  expired, or missing the Pages permission. Create a fresh token from
  the Edit Cloudflare Workers template and update the secret.
- `Account ID` error — check the Account ID copied from Account Home.
- `Project not found` — the first successful run creates the project
  automatically; do not create it by hand first.

## Custom domain (after the first live deployment)

Cloudflare Dashboard > Workers & Pages > `jason-fx-academy` >
Custom domains > Set up a custom domain > `jasonfxacademy.com`
(and `www.jasonfxacademy.com`). See `GMAIL_SETUP.md` for the same steps.

## Gmail lead form

The Pages Function in `functions/api/lead.js` still needs the Gmail
variables in Cloudflare Pages > Settings > Variables — see
`GMAIL_SETUP.md`. Add those after the first deployment, then redeploy
(push any change, or Run workflow again).
