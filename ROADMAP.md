# SoilPlus 2.0 — Roadmap

> **Mission:** make precision agriculture profitable for the 4 million smallholder
> farms of Central Asia — the region that feeds 80M people but loses 30-40% of
> water and 25% of yield to guesswork.
>
> **Wedge:** a $40 soil probe + AI agronomist that pays for itself in one season
> through water savings.
>
> Sultan Bekkaliev & Ersultan Muratkali · Uralsk, Kazakhstan

---

## The opportunity (why now)

| Signal | Number | Source |
|--------|--------|--------|
| Smallholder farms in Central Asia | ~4M | FAO, 2024 |
| Avg. water lost to over-irrigation | 30-40% | World Bank |
| Kazakh ag-tech penetration | <2% of farms | Astana Hub |
| Govt. subsidy on drip + sensors (KZ) | up to 50% capex | Минсельхоз РК 2025 |
| LLM cost / agronomist query | $0.0003 | Gemini 2.5 Flash |

The combination of (a) collapsing inference cost, (b) cheap ESP32-grade
hardware, and (c) state subsidies that pay 50% of our BOM has only existed
since 2024. This is a **<24-month window** before commodity hardware vendors
catch up.

---

## North-Star metric

**Liters of water saved per active farm per month.**

Every other KPI (MRR, retention, NPS) is downstream. Our field trial proved
**35% reduction at +5.4% yield** — we ship the metric to every user dashboard
so the value prop is *legible the moment they log in*.

Secondary: **Activation = first irrigation recommendation actioned within 7
days of signup.** This is what predicts retention.

---

## Phase 1 — Public launch (T+0 to T+30 days) ← *we are here*

**Goal:** ship a product strangers can use without us holding their hand.

- [x] Open source on GitHub (MIT) — `github.com/eroxa090/SoilPlus2.0`
- [x] Production deploy on Vercel
- [x] Supabase Postgres for users + orders
- [x] AI agronomist (Gemini 2.5 Flash) — chat, photo diagnosis, yield forecast
- [x] Irrigation engine (KazNIIZ + FAO-56)
- [ ] Custom domain `soilplus.kz`
- [ ] Landing page above the fold: 60s product video, water-saving counter, CTA
- [ ] PostHog or Plausible for funnel analytics
- [ ] Sentry for error tracking
- [ ] First 10 design-partner farms (free hardware, weekly call)

**Exit criteria:** 10 paying / piloting farms, <2% error rate, weekly active
recommendation usage on at least 6/10 plots.

---

## Phase 2 — Distribution & traction (T+1 to T+3 months)

**Goal:** prove we can acquire farmers without burning cash on ads.

### Channels (ranked by CAC)
1. **WhatsApp / Telegram agronomist bot** — free agronomy answers, soft-funnel into the device. Target CAC: $0.
2. **Government subsidy partnership** — list SoilPlus as approved hardware in the regional ag-subsidy program. CAC: 0, conversion: high.
3. **Agro-influencers in KZ/UZ** — 3 micro-influencers (10-50k farmer audience) on revenue share.
4. **Field days at regional MSH offices** — physical demos in West Kazakhstan, Almaty, Shymkent.

### Product expansion
- [ ] Telegram bot with same AI brain (most farmers live in WhatsApp/Telegram, not web)
- [ ] Multi-plot accounts (one farmer = many fields, each with own crop & sensor)
- [ ] Crop database: 11 → 30 (add melons, grapes, onion, carrot, cotton varieties)
- [ ] Historical charts: pH/EC/moisture trends, 7/30/90-day windows
- [ ] Open-Meteo integration → 3-day rain forecast modulates irrigation plan
- [ ] PDF/Excel report export (required for govt subsidy reimbursement)

### Hardware
- [ ] Finalize ESP32 firmware v1.0 (OTA updates via Supabase Storage)
- [ ] Production batch: **100 units** at $38 BOM
- [ ] Solar + LiFePO4 power kit, 30-day autonomy
- [ ] Box / instructions in Russian + Kazakh

**Targets at end of Phase 2:**
- 100 deployed devices
- 1,000 registered users on web/telegram
- $5K MRR (device sales + premium AI tier)
- 35%+ water savings validated across ≥10 unrelated farms

---

## Phase 3 — Y Combinator (T+3 to T+6 months)

**Goal:** raise YC W26 / S26 to fund the production + sales engine.

### Application package
- [ ] 60-second founder video (Russian-subtitled, showing real farmer using device)
- [ ] Traction one-pager: water saved, yield gain, MRR, retention
- [ ] 3-5 customer references willing to take YC partner calls
- [ ] $30K initial revenue or 500 paying users (whichever sooner) — concrete proof of demand

### Why we're fundable
- **Wedge nobody else has:** Russian-language AI agronomist trained on KazNIIZ + FAO-56, not generic ChatGPT
- **Distribution moat:** government subsidy listing = 50% off for the customer, paid by the state
- **Hardware-software flywheel:** every device adds training data nobody else has
- **Founders ship:** v1.0 of the entire stack built in <90 days, two students, no funding

### LOI / partnership targets
- [ ] Минсельхоз РК — listing in subsidy registry
- [ ] AgroBank Kazakhstan — financing for farmers buying SoilPlus on installment
- [ ] 1 major agroholding (Aitas / KazAgro) — pilot of 50 plots

---

## Phase 4 — Scale across Central Asia (T+6 to T+18 months)

**Goal:** become the default agronomy platform for Russian-speaking farmers.

### Geographic
- [ ] Uzbekistan launch (largest cotton + horticulture market in CA, ~40M people)
- [ ] Kyrgyzstan — partnership with USAID / GIZ ag-extension programs
- [ ] South Russia (Krasnodar, Stavropol) — same language, similar agronomy

### Product
- [ ] Mobile app (React Native shell over PWA, offline-first)
- [ ] Kazakh, Uzbek, English localization
- [ ] LoRa gateway for fields outside cellular coverage
- [ ] Multi-tenant orgs (farm manager + agronomist + workers, granular roles)
- [ ] B2B API — agroholdings paying $X/plot/month for white-label access

### Defensibility
- [ ] Train **own ML model** on 1M+ Central-Asian readings (Gemini becomes fallback, not core)
- [ ] Sentinel-2 satellite NDVI overlay per plot — diagnose without sensor
- [ ] Carbon credits MRV — fund ourselves through regenerative-ag carbon markets

**Targets at end of Phase 4:**
- 10,000 active farms
- $1M ARR
- Operations in 3+ countries
- Series A ready (or profitable, founder-controlled)

---

## Phase 5 — Long-term (T+18+ months)

- **Insurance & financing layer.** With sensor data we can underwrite parametric crop insurance and short-term input loans more accurately than banks. This is the real margin pool.
- **Drone-as-a-service.** Operator network using SoilPlus data to time spraying / fertilizing.
- **Marketplace.** Inputs (seeds, fertilizer) bought through SoilPlus get personalized recommendations + bulk discounts. Take 5-10%.
- **Open-data lobby.** Push regional governments to publish soil/weather APIs we can build on.

---

## Operating principles (how we make decisions)

1. **Talk to 5 farmers/week, every week, no exceptions.** Founder-led sales until $1M ARR.
2. **Ship weekly to production.** Velocity > polish. The web + bot are deployed continuously; firmware monthly.
3. **Russian + Kazakh first, English second.** Our customer is a 45-year-old farmer in Aktobe, not a SF VC.
4. **Charge from day one, even small amounts.** Free pilots become unpaid pilots. $20/season > $0 with a "promise to convert."
5. **Hardware is a wedge, software is the business.** Sell the device near cost; make money on subscription, data, and financial services.
6. **Open source the brain.** Algorithm in the open → trust + community contributions. Closed: data, models, integrations.

---

## What would change this plan

We will **kill or pivot** any of the above if:
- A farmer can't explain in their own words what SoilPlus does after 1 minute on the landing page → fix the wedge.
- Activation rate (first recommendation actioned in 7 days) drops below 40% → product-market fit is weaker than we think; stop hiring, fix activation.
- Govt subsidy program is killed by political change → re-anchor on agroholdings (B2B), not smallholders (B2C).
- A well-funded competitor lists in KZ subsidy registry first → race to lock exclusivity with Минсельхоз within 60 days.

---

## Tech debt parked deliberately (we'll come back)

- Unit tests on `lib/irrigation.ts` (the math is from a peer-reviewed source; we trust it)
- Redis-backed rate limiting (in-memory is fine until 10k+ DAU)
- CI/CD with GitHub Actions (Vercel auto-deploy is sufficient until Phase 3)
- Audit logs (add when we sign the first agroholding)

---

## Team

| Role | Person | Background |
|------|--------|------------|
| Co-founder, CEO, full-stack & AI | Ersultan Muratkali | Built the entire stack from zero |
| Co-founder, CTO, hardware & firmware | Sultan Bekkaliev | ESP32 firmware, sensor calibration |
| **Hire #1** (after YC) | Field agronomist | Russian speaker, KazNIIZ-trained, runs design-partner farms |
| **Hire #2** | Sales lead | Ag-distribution network in KZ/UZ |

---

*Last updated: 2026-04-27 · github.com/eroxa090/SoilPlus2.0 · soilplus.kz*
