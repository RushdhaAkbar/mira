# Mira — Virtual Try-On & Smart Sizing

Mobile-first Next.js app: pick a garment, enter five measurements, upload a photo, see the garment on your body, and get an honest fit score with an S / M / L recommendation. Includes an AI stylist, bag and demo checkout.

The original clickable prototype and the project proposal live in [`docs/`](docs/).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript), Tailwind CSS 4 |
| Fonts | Playfair Display (display) + Manrope (body) via `next/font` |
| Database | MongoDB Atlas (photos and renders auto-delete after 24 h via TTL index) |
| Analysis AI | Claude (photo check, fit explanation, AI stylist) via `@anthropic-ai/sdk` |
| Try-on image | Nano Banana (`gemini-2.5-flash-image`) via the Gemini REST API |
| Hosting | Vercel, connected to this GitHub repo |

Every external key is optional. Without keys the site runs in **preview mode**: rule-based sizing, a 2D garment overlay instead of the AI render, template explanations and canned stylist looks. Adding a key switches that feature on with no code change.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run dev                  # http://localhost:3000
```

## Environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Atlas connection string. Without it, photos live in server memory (dev only). |
| `MONGODB_DB` | Database name, default `mira`. |
| `ANTHROPIC_API_KEY` | Enables the Claude features. |
| `CLAUDE_MODEL` | Default `claude-opus-5`; `claude-sonnet-5` is the cheaper option. |
| `GEMINI_API_KEY` | Enables the Nano Banana try-on render. |
| `GEMINI_IMAGE_MODEL` | Default `gemini-2.5-flash-image`. |
| `NEXT_PUBLIC_SITE_URL` | Public URL used in share links. |

## Project structure

```
src/
  app/                 screens (home, shop, profile, upload, try-on, results, stylist, bag, checkout)
  app/api/             products, photos, analyze-photo, tryon, fit, stylist, orders
  components/          Shell (top bar + bottom nav), ui primitives, ProductCard, Icons
  lib/products.ts      catalogue (edit garments here)
  lib/sizing.ts        S/M/L rules, fit score, body shape
  lib/ai/claude.ts     Claude calls with structured output
  lib/ai/nanobanana.ts Gemini image call
  lib/mongodb.ts       cached client + TTL indexes + in-memory fallback
  lib/store.tsx        client state persisted to localStorage
```

## Deploy on Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New Project**, import the repo, keep the Next.js defaults.
3. Add the environment variables above under **Settings > Environment Variables**.
4. Deploy. Set `NEXT_PUBLIC_SITE_URL` to the assigned domain and redeploy once.

## Privacy

Uploaded photos and try-on renders are stored with an `expiresAt` timestamp and a MongoDB TTL index removes them 24 hours later. The shopper can also delete a photo immediately from the upload screen.
