# Auto-posting setup (Blotato)

The content dashboard (`/admin/content`) can publish for you. Until you finish
the steps below it stays in **approve-only mode**: approving a draft marks it
`approved` and you post it by hand. Once Blotato is wired, **approving a draft
publishes it** to the matching platform and flips it to `scheduled`.

Code that makes this work: `lib/scheduler.ts` (the adapter) and
`app/api/admin/content/route.ts` (calls it on approve).

## One-time setup (~30–45 min, mostly connecting accounts)

1. **Make a Blotato account** at blotato.com on the **$29/mo Starter** plan.
   The API does not work on the free trial.

2. **Connect your accounts** in the Blotato dashboard:
   - **Instagram** — a **Business or Creator** account linked to a Facebook
     Page. Meta requires this.
   - **Twitter / X**
   - **Pinterest** — connect it and create at least one board.
   - **TikTok** — connect it for photo carousels. Posts go out public via Direct
     Post, with no in-app finish step.

3. **Generate an API key**: Settings → API → Generate API Key. Copy it. Keep any
   trailing `=`; it is part of the key.

4. **Add the key + site URL to `.env.local`:**
   ```
   SCHEDULER_PROVIDER=blotato
   BLOTATO_API_KEY=<paste, quote it if it contains = signs>
   NEXT_PUBLIC_SITE_URL=https://toxome.app
   ```

5. **Pull your account + board IDs:**
   ```
   node scripts/blotato-accounts.js
   ```
   It prints the env lines to paste into `.env.local`:
   ```
   BLOTATO_INSTAGRAM_ACCOUNT_ID=...
   BLOTATO_TWITTER_ACCOUNT_ID=...
   BLOTATO_PINTEREST_ACCOUNT_ID=...
   BLOTATO_PINTEREST_BOARD_ID=...
   BLOTATO_TIKTOK_ACCOUNT_ID=...
   ```

6. **Set the same vars in Vercel** (Project → Settings → Environment Variables)
   and redeploy, so the live dashboard publishes and not only your local one.

## How it behaves once wired

- The dashboard header switches from "approve-only mode" to "approve → pushes to
  scheduler", and the **Scheduled** column appears.
- **Approve** (Review or Board) publishes to that draft's platform. On success
  the row moves to `scheduled` with the Blotato submission id. On failure it
  stays `approved` and shows the error on the card.
- Media: the adapter turns site-relative paths (`/carousel/<slug>/slide-0.png`)
  into absolute `https://toxome.app/...` URLs, and expands carousels to every
  slide, up to Blotato's cap of 10.
- Guards: the adapter rejects Instagram, Pinterest, and TikTok posts that have
  no image, since those platforms require media. X allows text-only.
- TikTok: a draft with a carousel (`/carousel/<slug>/slide-0.png`) posts as a
  public TikTok photo slideshow (up to 20 slides), title on the post, body as the
  description. It uses Direct Post, so no finishing step in the TikTok app.

## Test before you trust it

1. Make a throwaway draft for **X first**. Text-only verifies fastest.
2. Approve it. Confirm the row moves to `scheduled` and the post lands on X.
3. Then test an **Instagram** image/carousel and a **Pinterest** pin.
4. Watch `https://my.blotato.com/failed` for rejected publishes.

## Notes

- Publishing is **async**. Blotato returns a submission id, not the live post id.
  "Scheduled" in the dashboard means "handed to Blotato"; confirm the live result
  in the Blotato dashboard.
- Rate limit: 30 publish calls per minute, far above normal use.
- Pinterest links point at `NEXT_PUBLIC_SITE_URL`. Change the `link` in
  `pushToBlotato` to deep-link pins elsewhere.
