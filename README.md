# 🎙️ Munshi (मुंशी)
### **Hire a voice receptionist by explaining the job. Not by writing prompts.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-munshi--hackathon--prototype.vercel.app-0D7377?style=for-the-badge&logo=vercel)](https://munshi-hackathon-prototype.vercel.app)
[![ElevenLabs](https://img.shields.io/badge/Powered%20By-ElevenLabs%20Conversational%20AI-black?style=for-the-badge&logo=elevenlabs)](https://elevenlabs.io)
[![ArmorIQ Security](https://img.shields.io/badge/Security-ArmorIQ%20Intent%20Governance-blue?style=for-the-badge)](https://docs.armoriq.ai)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.5.28-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)

> **Build Arena Hackathon** · **Problem Statement 2: No-Code Voice AI Agent Builder (ElevenLabs)**  
> **Team:** DOT DOT COM (**Ansh Varshney**)  
> **Live Production:** [https://munshi-hackathon-prototype.vercel.app](https://munshi-hackathon-prototype.vercel.app)

---

## 🌟 The Vision

Out of every 100 incoming calls to small clinics, salons, and repair shops, **46 go unanswered**. Dr. Mira Sharma runs a two-chair dental clinic in Indirapuram. When her hands are busy treating patients, the phone rings off the hook. 

She knows her front-desk operations inside and out, but she cannot code, and current voice agent builders demand complex system prompts, JSON schemas, API keys, and webhook pipelines.

**Munshi solves this entirely.**
Instead of writing prompts or configuring nodes, the business owner **explains the job out loud**—exactly like briefing a new human employee. Munshi listens, compiles a structured rule card, runs the receptionist through a rigorous 24-run probabilistic **Trial Day**, allows her to coach mistakes in **one plain sentence**, and safeguards all tool calls through **ArmorIQ** intent-aware runtime governance before going live.

```
       🗣️ EXPLAIN                      📋 CHECK                     🧪 TEST
┌──────────────────────┐        ┌──────────────────────┐     ┌──────────────────────┐
│ Voice Interview /    │ ─────▶ │ Structured Job Card  │ ──▶ │ Trial Day: 8 Tests   │
│ Plain-Text Starter   │        │ (Zod Validated)      │     │ × 3 Probabilistic    │
└──────────────────────┘        └──────────────────────┘     └──────────┬───────────┘
                                                                        │
                                                                        ▼
       🚀 GO LIVE                      🛡️ SECURE                    🔧 COACH
┌──────────────────────┐        ┌──────────────────────┐     ┌──────────────────────┐
│ Verified Merge       │ ◀───── │ ArmorIQ Runtime      │ ◀── │ Spoken One-Sentence  │
│ 3/3 Pass Gate Only   │        │ Sentry & Guardrails  │     │ Fix + Auto-Test Gen  │
└──────────────────────┘        └──────────────────────┘     └──────────────────────┘
```

---

## 📸 Product Walkthrough & Visual Proof

### 1. Bilingual Landing Page & 60-Second Explainer Video
A warm, human interface designed with a tailored palette (warm paper `#FBF8F3`, deep teal `#0D7377`, saffron `#E8833A`). Includes a real-time interactive phone simulator and a **60-second bilingual explainer video** with synchronized English and Hindi narration tracks that preserve timestamp on switch.

| English Landing Experience | Native Hindi Experience (633 Translated Strings) |
| :---: | :---: |
| ![Landing Hero](docs/images/landing-hero.png) | ![Landing Hindi](docs/images/landing-hindi.png) |

| 60-Second Video Player (Dual Audio Stream) | Mobile-First Responsive Experience |
| :---: | :---: |
| ![Video Player](docs/images/landing-video-player.png) | ![Mobile Layout](docs/images/landing-mobile.png) |

---

### 2. The 5-Step Agent Lifecycle

#### Step 1: Voice Interview — "Explain the Job"
The owner taps the microphone and speaks naturally. Munshi's conversational interviewer asks 8 everyday questions (business name, hours, services, prices, booking rules, emergency hand-offs, what to never do, and what to say when unsure).

![Voice Interview](docs/images/01-voice-interview.png)

#### Step 2: The Job Card — Human-Readable Rules
Gemini distills the voice transcript into a clear, structured **Job Card**. The owner can inspect approved prices, edit hours, or select a voice from the ElevenLabs library with one-click audio previews. No technical jargon, no raw prompts.

![Job Card Review](docs/images/02-job-card-review.png)

#### Step 3: Trial Day — 8 Tricky Calls, 3 Runs Each
Before a single real customer calls, Munshi subjects the receptionist to **Trial Day**: 8 edge-case calls evaluated 3 times each (**24 total runs**) using the **ElevenLabs Agent Testing API**. In version 1, a caller asks for teeth whitening; since it wasn't on the price list, the receptionist hallucinates a price of ₹3,000. **Trial Day catches it immediately.**

![Trial Day Testing](docs/images/03-trial-day-testing.png)

#### Step 4: Spoken Coaching — "Fix It in One Sentence"
The owner doesn't edit a 2,000-word prompt. She simply speaks or types one corrective sentence:
> *"If a price is not on the list, never guess. Say you will confirm and take a callback number."*

Gemini analyzes the correction, updates the Job Card, and automatically synthesizes a **permanent regression test**. Munshi branches the ElevenLabs agent into **Version 2**.

![Coach Fix](docs/images/04-coach-fix.png)

#### Step 5: Version 2 Verification & Gated Go-Live
Trial Day re-runs all tests against Version 2. All 8 situations pass 3 out of 3 (**24/24 passed**). The Go-Live gate unlocks, merging the branch to production and generating:
- A public call link for customers (`/talk/[clinicId]`)
- An embeddable `<elevenlabs-convai>` web widget snippet
- Verified telephone routing via SIP/Twilio

| Version 2: 24/24 Tests Passed | Gated Go-Live Dashboard |
| :---: | :---: |
| ![Version 2 Passed](docs/images/05-version2-passed.png) | ![Go Live](docs/images/06-go-live.png) |

---

## 🛠️ Complete Technology Stack & Tools Used

### 1. 🎙️ ElevenLabs Conversational AI Suite
Munshi leverages the full depth of the ElevenLabs platform:
* **Agents API (`@elevenlabs/react`, `@elevenlabs/elevenlabs-js`)**: Orchestrates conversational state machines with low-latency WebSockets.
* **Client Tools**: Mid-interview extraction where the interviewer calls client tools to update the UI live as the user speaks.
* **Server Webhook Tools**: The receptionist autonomously executes real-time backend actions mid-call (`check-slots`, `book-slot`, `log-callback`).
* **Agent Testing API**: Uses `POST /v1/convai/agent-testing/create` and `POST /v1/convai/agents/{id}/run-tests` with `repeat_count: 3` to evaluate next-reply accuracy, tool calls, and simulation mocks.
* **Branching & Versioning**: Isolated branch creation (`/branches`) and atomic merges (`/merge`) guarantee that untested prompt changes never reach patients.
* **Scribe v2 Speech-to-Text**: High-accuracy transcription for vocal interview answers and spoken coaching.
* **Flash v2.5 Multilingual TTS**: Ultra-low latency voice synthesis in English and Hindi (featuring warm Indian voices like "PP").
* **Post-Call Webhook**: HMAC-SHA256 signature verification for call transcripts, duration, audio recordings, and sentiment.

---

### 2. 🛡️ ArmorIQ — Runtime Agent Security & Intent Governance
Integrating [ArmorIQ](https://docs.armoriq.ai/) provides enterprise-grade safety and intent verification for our autonomous voice receptionist:

```
                  ┌──────────────────────────────────────────────┐
                  │          ElevenLabs Voice Receptionist       │
                  └──────────────────────┬───────────────────────┘
                                         │ Tool Call: book_slot
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │       🛡️ ArmorIQ Runtime Sentry Layer        │
                  ├──────────────────────────────────────────────┤
                  │ 1. Intent Verification: Authorized action?   │
                  │ 2. Parameter Sanitization: Valid datetime?   │
                  │ 3. Guardrails: No hallucinated discounts     │
                  │ 4. Prompt Injection & Jailbreak Defense      │
                  └──────────────────────┬───────────────────────┘
                                         │ Evaluated: ALLOW
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │      MongoDB Atlas Verified Slot Booking     │
                  └──────────────────────────────────────────────┘
```

* **Intent-Aware Policy Enforcement**: Before any tool call (`book-slot`, `check-slots`, `log-callback`) is executed on our database, ArmorIQ validates the agent's intent against the clinic's declared policy rules.
* **Sentry Interceptor**: Protects against prompt injection attacks (e.g. callers tricking the AI into booking appointments for free or altering clinic operating parameters).
* **Price Hallucination Barrier**: Strict boundary policies prevent the voice agent from quoting rates or discounts outside the verified Job Card list.
* **Cryptographic Audit Logs**: Every autonomous action taken by the voice agent is recorded with cryptographic provenance for healthcare compliance and dispute resolution.

---

### 3. 🧠 Google Gemini 2.5
* **Conversational Slot Filling**: Extracts 8 structured fields from raw voice interviews into strict Zod schemas.
* **Rule Compiler**: Compiles human-readable Job Cards into prompt guidelines without exposing raw engineering tokens.
* **Coach & Test Synthesizer**: Converts one-sentence human feedback into operational rules and generates negative test cases for the ElevenLabs test pack.
* **Conversation Intelligence**: Performs post-call sentiment analysis, caller intent classification, and resolution scoring.

---

### 4. 🗄️ MongoDB Atlas (Verified Transactional Calendar)
* **Zero Fake Bookings**: A booking is only valid if `book_slot` returns a verified `bk_` ID generated by MongoDB with atomic slot reservation.
* **Double-Booking Prevention**: Strict compound unique index (`clinicId` + `start`) stops race conditions across simultaneous callers.
* **Audit Verification**: The post-call processor cross-checks any booking ID spoken by the agent against MongoDB records. If the agent uttered an unverified booking ID, it is immediately flagged as a hallucination in the dashboard.

---

### 5. ⚡ Next.js 15, React 19 & Three.js
* **Next.js 15.5.28 App Router**: Route handlers, streaming UI, and security headers.
* **Zero Browser API Key Exposure**: All client voice sessions run via short-lived signed URLs (`GET /v1/convai/conversation/get-signed-url`).
* **3D Audio-Reactive Orb**: Custom `@react-three/fiber` visualizer with real-time frequency analysis during active voice calls.
* **Complete Bilingual i18n**: Bespoke client-side localization system (`src/lib/i18n.tsx`) supporting 633 English and Hindi terms with zero external runtime overhead.

---

## 🏛️ System Architecture

```
                    ┌───────────────────────────────────────────┐
                    │     Client Browser / Mobile / Widget      │
                    │   (Next.js 15, React 19, Three.js Orb)    │
                    └─────────────────────┬─────────────────────┘
                                          │ 1. Ephemeral Signed URL Request
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Munshi Core Engine                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  • Interview Coordinator          • Rule & Prompt Compiler (compile.ts)               │
│  • Zod Card Validator (jobcard.ts) • Test Pack Orchestrator (testpack.ts)               │
│  • Speech-to-Text Pipeline (STT)  • Versioning & Branch Manager (workflow.ts)          │
└───────────────┬─────────────────────────┬───────────────────────────────┬──────────────┘
                │                         │                               │
                ▼                         ▼                               ▼
    ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────────────────┐
    │  ElevenLabs Platform │  │   Google Gemini 2.5  │  │   🛡️ ArmorIQ Security Sentry   │
    ├──────────────────────┤  ├──────────────────────┤  ├────────────────────────────────┤
    │ • Conversational AI  │  │ • Job Card Analyzer  │  │ • Intent-Aware Guardrails      │
    │ • Agent Testing Suite│  │ • Rule Synthesis     │  │ • Tool Call Interception       │
    │ • Flash v2.5 TTS     │  │ • Test Generation    │  │ • Prompt Injection Defense     │
    │ • Scribe v2 STT      │  │ • Sentiment Scoring  │  │ • Audit Log & Provenance       │
    └───────────┬──────────┘  └──────────────────────┘  └───────────────┬────────────────┘
                │                                                       │
                └─────────────────────────┬─────────────────────────────┘
                                          ▼ Verified Action
                              ┌──────────────────────┐
                              │  MongoDB Atlas       │
                              │  • Atomic Calendars  │
                              │  • Call Logs         │
                              │  • Booking Integrity │
                              └──────────────────────┘
```

---

## 🛡️ Responsible AI & Safety Guarantees

1. **Mandatory Identity Disclosure**: Every receptionist greeting begins with explicit confirmation that the caller is speaking with an AI assistant.
2. **Medical Advice Prohibition**: The agent strictly declines medical inquiries, symptom diagnosis, and prescription questions, automatically initiating an urgent callback for a licensed doctor.
3. **No Untested Version in Production**: The Go-Live engine cryptographically verifies that the current branch has passed 100% of required blocker tests 3/3 before permitting deployment.
4. **Instant Rollback**: Every version exists on an immutable ElevenLabs agent branch; rolling back to a previous build takes under 2 seconds.

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: v20 or higher
- **Package Manager**: npm or pnpm
- **MongoDB Atlas** cluster URI
- **ElevenLabs API Key**
- **Google Gemini API Key**

### Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:anshvarshney1502/prototype.git munshi
   cd munshi
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/munshi?retryWrites=true&w=majority

   # AI Providers
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ELEVENLABS_WEBHOOK_SECRET=your_webhook_signing_secret
   GEMINI_API_KEY=your_gemini_api_key

   # Tool Security
   TOOL_SECRET=your_internal_shared_secret_min_32_chars

   # Public Base URL (for webhooks & tools)
   PUBLIC_BASE_URL=https://your-deployment-domain.com
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run Production Build & Verification:**
   ```bash
   npm run build
   npm run start
   ```

---

## 📁 Repository Structure

```
munshi/
├── docs/
│   └── images/              # High-resolution screenshots of the entire product flow
├── public/
│   ├── explainer/           # 60s English & Hindi MP4 explainer videos + poster
│   └── favicon.svg          # Munshi brand icon
├── scripts/
│   ├── live-booking.ts      # Live end-to-end booking verification test
│   ├── smoke-elevenlabs.ts  # ElevenLabs Agent & Testing API connectivity test
│   ├── test-access.sh       # Multi-tenant isolation and security test suite
│   ├── test-calendar.ts     # MongoDB double-booking prevention test
│   └── test-rollback.ts     # Instant branch rollback verification test
├── src/
│   ├── app/
│   │   ├── api/             # Next.js route handlers (clinics, versions, tools, runs, voices)
│   │   ├── c/[id]/          # Main workspace: Explain, Card, Practice, Fix, Go Live, Calls
│   │   ├── talk/[id]/       # Public customer-facing voice receptionist interface
│   │   ├── layout.tsx       # Root layout with font optimization & i18n provider
│   │   └── page.tsx         # Redesigned bilingual landing page
│   ├── components/
│   │   ├── landing/         # Landing hero, 60s dual-audio explainer player, practice demo
│   │   ├── workspace/       # Interview, JobCardStep, TrialDay, Coach, GoLive, Calls
│   │   ├── Builder.tsx      # Start-from-scratch or starter selector
│   │   ├── Icons.tsx        # Tailored SVG icon system
│   │   ├── Logo.tsx         # Brand mark and wordmark
│   │   └── Orb.tsx          # Three.js 3D audio-reactive orb visualizer
│   └── lib/
│       ├── calendar.ts      # Slot calculation & atomic booking engine
│       ├── compile.ts       # Job card to prompt compiler
│       ├── db.ts            # MongoDB Atlas connection manager & schemas
│       ├── elevenlabs.ts    # ElevenLabs SDK wrapper (Agents, Tests, Branches, Scribe)
│       ├── gemini.ts        # Google Gemini extraction & synthesis pipeline
│       ├── i18n.tsx         # Zero-overhead English & Hindi localization engine
│       └── jobcard.ts       # Strict Zod schema for receptionist rule cards
└── vercel.json              # Vercel deployment configuration
```

---

## 🏆 Hackathon Submission Details

* **Event:** Build Arena Hackathon (2026)
* **Problem Statement:** #2 — No-Code Voice AI Agent Builder (ElevenLabs)
* **Team Name:** DOT DOT COM
* **Developer:** Ansh Varshney
* **Live Deployment:** [https://munshi-hackathon-prototype.vercel.app](https://munshi-hackathon-prototype.vercel.app)
* **GitHub Repository:** [https://github.com/anshvarshney1502/prototype](https://github.com/anshvarshney1502/prototype)
* **Explainer Videos:** Included directly in the web player with English / Hindi live audio toggle (`/explainer/munshi-en.mp4`, `/explainer/munshi-hi.mp4`)

---

*Made with ❤️ for small business owners who deserve a receptionist that never sleeps.*
