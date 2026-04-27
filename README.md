# 🌱 SoilPlus 2.0

> **IoT + AI precision-agriculture platform for Central Asian farms.**
> Made in Uralsk, Kazakhstan · 2026

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![Powered by Gemini](https://img.shields.io/badge/AI-Gemini%202.5-4285F4)](https://ai.google.dev)

SoilPlus turns a single ESP32 soil probe into a full agronomy assistant:
real-time pH, EC, moisture and temperature → AI-powered diagnostics, irrigation
schedules, and yield forecasts grounded in **KazNIIZ + FAO-56** methodology.

---

## ✨ What it does

| Feature             | What you get                                                                  |
| ------------------- | ----------------------------------------------------------------------------- |
| 🤖 **AI Agronomist** | Chat with a domain-prompted Gemini 2.5 Flash, in Russian or English.          |
| 📷 **Photo diagnose** | Upload a leaf photo → species ID + disease + numbered treatment plan.        |
| 💧 **Irrigation calc** | KazNIIZ formula `V = ΔW × D × ρ × S × K_pH × K_EC`, FAO-56 35 L/m² cap.       |
| 📈 **Yield forecast**  | Per-hectare expected yield with risks & boosters.                           |
| 🛒 **Shop**          | Order the SoilPlus device; admin dashboard for fulfillment.                   |
| 🔐 **Secure auth**   | PBKDF2-sha512 (100k iters) + HMAC-signed httpOnly session cookies.            |

---

## 🧪 The science

The irrigation engine implements the formula validated in our field trials
(120 days, 35% water saved, +5.4% yield):

```
V = ΔW × D × ρ × S × K_pH × K_EC

  ΔW   — moisture deficit (W_opt - W_current)
  D    — root-zone depth, m
  ρ    — bulk soil density, kg/m³ (1400 default for loam)
  S    — area, m²
  K_pH — 0.85 if pH outside crop band, else 1.0
  K_EC — 1.30 if EC > crop max (flush mode), else 1.0
```

Single watering events are capped at **35 L/m²** per FAO-56 to avoid runoff
and deep percolation; larger deficits are split into multiple events with
12–24 h soak intervals.

---

## 🏗 Tech stack

```
Frontend     Next.js 15 · React 19 · TailwindCSS · Framer Motion · Recharts
Backend      Next.js Route Handlers (Node runtime) · Supabase Postgres
AI           Google Gemini 2.5 Flash (@google/generative-ai SDK)
Hardware     ESP32 + DS18B20 + pH/EC/moisture probes (firmware in /firmware)
Deploy       Vercel (zero-config) · Supabase managed Postgres
```

---

## 🚀 Run locally

```bash
git clone https://github.com/<your-username>/soilplus.git
cd soilplus
npm install
cp .env.local.example .env.local      # then fill in the 4 keys below
npm run dev                            # → http://localhost:3000
```

### Required environment variables

| Variable                          | Where to get it                                                |
| --------------------------------- | -------------------------------------------------------------- |
| `GOOGLE_GENERATIVE_AI_API_KEY`    | https://aistudio.google.com/apikey (free tier, key starts `AIzaSy…`) |
| `NEXT_PUBLIC_SUPABASE_URL`        | Supabase project settings → API                                |
| `SUPABASE_SERVICE_ROLE_KEY`       | Supabase project settings → API (⚠️ server-side only)          |
| `SESSION_SECRET`                  | Any 32+ char random string (e.g. `openssl rand -hex 32`)       |

The first user to register on a fresh deployment automatically becomes admin.

---

## 📁 Project layout

```
app/
  api/             Route handlers (chat, diagnose, forecast, analyze, auth, orders)
  about/           Public project page
  irrigation/      Irrigation calculator UI
  diagnose/        Photo-diagnose UI
  shop/            Device shop + order form
  admin/           Admin dashboard
components/        Shared UI (cards, nav, charts)
lib/
  irrigation.ts    KazNIIZ + FAO-56 calculator (pure function)
  crops.ts         11-crop database with optimum bands
  auth/            PBKDF2 + HMAC session helpers
  supabase/        Server + browser clients
firmware/          ESP32 Arduino sketch
```

---

## 🛡 Security

See [`SECURITY.md`](./SECURITY.md) for the full threat model, secret-rotation
runbook, and pre-deploy checklist.

---

## 🗺 Roadmap

See [`ROADMAP.md`](./ROADMAP.md). Highlights:

- **Phase 1** — public deploy, README, MIT license ← *we are here*
- **Phase 2** — YC application + pilot farms in West Kazakhstan region
- **Phase 3** — Telegram bot, LoRa gateway, multi-tenant farms
- **Phase 4** — mobile app, Kazakh/Uzbek/English localization

---

## 👥 Team

- **Sultan Bekkaliev** — co-founder, hardware & firmware
- **Ersultan Muratkali** — co-founder, full-stack & AI

Uralsk · West Kazakhstan · 2026

---

## 📄 License

[MIT](./LICENSE) — free to use, fork, and build on.
If SoilPlus helps your farm or project, we'd love to hear about it.

---

## 🌍 Contributing

We welcome issues and PRs. For larger changes, please open an issue first
to discuss what you'd like to change.

```bash
# fork, then:
git checkout -b feature/your-feature
npm run lint && npm run build
git commit -m "feat: your feature"
# open PR against main
```

---

*Robots meet soil · heritage stays alive.* 🌾
