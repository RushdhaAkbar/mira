# MIRA — Virtual Try-On & Smart Sizing
### Project Proposal · MVP · July 2026

**Prepared for:** Marketing (BSc) — module assignment
**Inspiration / benchmark:** loomeé.com (AI fashion try-on)
**Prototype:** `mira-prototype.html` (open in any browser — fully clickable)
**Delivery deadline:** September 2026

---

## 1. Executive Summary

Mira is a mobile-first web application that lets shoppers **see clothing on their own body before buying**. A customer uploads a full-body photo, enters five basic measurements, and Mira drapes the selected garment (plus accessories) onto their photo, then delivers an honest **fit score** (poor fit → highly fit) and a final **size recommendation (S / M / L)**.

The MVP is built almost entirely on **free and open-source tools**, keeping the total cash budget under **USD 25 (~LKR 7,500)**, and is achievable by a small student team within **6 weeks (28 July → 7 September 2026)**.

**Why it matters (the marketing case):** fashion e-commerce suffers ~25–40% return rates, driven mainly by size uncertainty. Virtual try-on attacks the single biggest conversion barrier in online fashion — *"will it fit me, and will it suit me?"* — while generating shareable content and rich first-party customer data.

---

## 2. Problem & Opportunity

| Problem | Consequence | Mira's answer |
|---|---|---|
| Shoppers can't judge fit online | High return rates, abandoned carts | Fit score + per-zone fit analysis |
| Size charts vary by brand | Wrong-size orders | Measurement-based S/M/L recommendation |
| No emotional "try it on" moment online | Low engagement & conversion | Photo-based virtual try-on |
| Generic shopping experience | Weak loyalty | AI stylist + saved wardrobe (extras) |

---

## 3. Core Features (the 6 prototype screens)

1. **Home** — brand promise ("See it on you, before you buy it"), category browsing, trending looks, single dominant CTA into the try-on journey.
2. **Clothing & accessories** — filterable catalogue; select a garment and layer accessories (necklace, handbag, sunglasses) that carry into the try-on.
3. **Size & style profile** — height, weight, bust, waist, hips + preferred fit (slim / regular / oversized) and fashion-style tags → live **S/M/L recommendation with a confidence score**.
4. **Upload photo** — take a picture (with pose guide) or choose from gallery; quality tips; body-detection confirmation; **photos auto-deleted after 24 h** (trust signal).
5. **Virtual try-on** — garment draped on the user's body; swap colours, sizes and accessories in real time.
6. **Fit results** — fit score gauge (**poor fit / moderate / highly fit**), per-zone breakdown (shoulders, bust, waist, hips), **final size recommendation**, save / share / buy actions.

### Extra functionalities (differentiators to highlight)
- **✦ AI Stylist** — occasion-based outfit suggestions matched to body shape and declared style tags, with a style-match %.
- **Saved wardrobe & fit history** — recommendations improve over time; drives repeat visits.
- **Share-your-look social cards** — every result screen is a branded, shareable asset (organic reach engine).
- **Privacy-first messaging** — 24-hour photo deletion as a stated promise (top adoption barrier addressed).

---

## 4. Target Audience & Positioning

- **Primary:** women 18–34, urban, shop fashion online 1+ times/month, active on Instagram/TikTok, frustrated by sizing inconsistency.
- **Secondary:** online fashion retailers (B2B licensing of the try-on widget — future revenue path).
- **Positioning statement:** *For online fashion shoppers who fear ordering the wrong size, Mira is the virtual fitting room that shows clothes on **your** body and tells you honestly how they'll fit — unlike static size charts or model photos.*

---

## 5. Tech Stack (free / open-source first)

| Layer | Tool | Cost | Why |
|---|---|---|---|
| UI design & prototyping | **Figma** (free tier) + HTML prototype | Free | Industry standard; the included HTML prototype is presentation-ready |
| Frontend | **React (Vite) + Tailwind CSS** | Free | Fast to build, huge free ecosystem |
| Body detection | **Google MediaPipe Pose** (runs in-browser) | Free | 33 body key points client-side — no server GPU needed |
| Try-on engine (MVP) | 2D garment overlay on pose key points (own code) | Free | Realistic enough for MVP; zero cloud cost |
| Try-on engine (stretch) | **IDM-VTON / OOTDiffusion** open-source models via **Hugging Face Spaces** free tier | Free | Photorealistic AI try-on if time allows |
| Size recommendation | Rule-based algorithm (own code, as in prototype) | Free | Transparent, explainable, no training data needed |
| Backend, auth, storage | **Supabase** (free tier) | Free | Postgres + auth + file storage; 24 h photo deletion via scheduled function |
| Hosting | **Vercel** or **Netlify** (free tier) | Free | Git-push deployment, free SSL |
| Analytics | **Google Analytics 4** | Free | Conversion & funnel KPIs for the marketing report |
| Versioning | **GitHub** (free) | Free | Collaboration + portfolio evidence |

---

## 6. Budget

| Item | Cost (USD) | Notes |
|---|---|---|
| Design, dev tools, hosting, backend, analytics | **$0** | All free tiers / open source |
| Domain name (optional, e.g. mira.lk / .app) | ~$12/yr | Only if a public demo URL is wanted; free `*.vercel.app` subdomain otherwise |
| Product photography (sample garments) | $0 | Phone camera + free stock (Unsplash/Pexels) |
| Contingency (print, presentation, misc.) | ~$10 | |
| **Total (maximum)** | **≈ $22 (~LKR 6,700)** | **$0 minimum if the free subdomain is used** |

*Post-MVP scale-up (not needed for the assignment): GPU inference for photorealistic try-on ≈ $30–80/month (Hugging Face / RunPod), Supabase Pro $25/month.*

---

## 7. Timeline (28 July → 7 September 2026)

| Week | Dates | Milestone |
|---|---|---|
| 1 | Jul 28 – Aug 3 | Research & benchmarking (loomeé et al.), final feature lock, Figma wireframes |
| 2 | Aug 4 – 10 | High-fidelity UI for all 6 screens + stylist extra (done — see prototype) |
| 3 | Aug 11 – 17 | Build frontend: home, catalogue, size profile; size-recommendation algorithm |
| 4 | Aug 18 – 24 | Photo upload + MediaPipe body detection + 2D garment overlay |
| 5 | Aug 25 – 31 | Fit-score engine, results screen, AI stylist mock, Supabase wiring |
| 6 | Sep 1 – 7 | User testing (10–15 testers), bug fixes, analytics, deploy, **final report & presentation** |
| Buffer | Sep 8 → deadline | Polish, rehearsal, submission |

---

## 8. Marketing & Success Metrics (KPIs)

**Launch plan (student-budget):** Instagram/TikTok teaser reels of the try-on moment, campus ambassador seeding, "share your look" referral loop built into the results screen.

| KPI | Target (pilot) |
|---|---|
| Try-on completion rate (upload → result) | ≥ 60% |
| Size-recommendation acceptance | ≥ 70% of users pick the recommended size |
| Avg. session time | ≥ 3 min |
| Looks shared per 100 users | ≥ 15 |
| Simulated return-rate reduction (survey-based) | −20% intent to return |

---

## 9. Risks & Mitigation

| Risk | Mitigation |
|---|---|
| AI try-on too complex for timeline | MVP ships with 2D overlay (already sufficient for demo); photorealistic model is a stretch goal |
| Photo privacy concerns | Client-side processing where possible + 24 h auto-deletion, stated in the UI |
| Free-tier limits | Usage well within Supabase/Vercel free quotas at pilot scale |
| Team time constraints | Weekly milestones with a built-in buffer week before submission |

---

## 10. Conclusion

Mira demonstrates a complete, realistic product journey — browse → measure → upload → try on → trust the fit — built on a **near-zero budget** with **free, open-source technology**, and framed around a clear marketing thesis: *removing fit uncertainty is the highest-leverage conversion and retention play in online fashion.* The clickable prototype, budget, stack, and 6-week plan make this immediately executable before the September deadline.
