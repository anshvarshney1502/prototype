# Munshi

**Hire a voice receptionist by explaining the job. Not by writing prompts.**

Build Arena Hackathon · Problem Statement 2: No-Code Voice AI Agent Builder (ElevenLabs) · Team DOT DOT COM (Ansh Varshney)

A clinic owner explains her front desk out loud, the way she'd brief a new hire. Munshi turns that into an ElevenLabs voice agent, runs it through eight tricky calls three times each, lets her fix a mistake by saying one sentence, and only lets it go live when every blocker test passes 3/3.

```
Interview ─▶ Job card ─▶ Trial Day ─▶ Coach ─▶ Go live ─▶ Calls
                             ▲           │
                             └─ a test fails → new version → every test re-runs
```

## The loop, mapped to the brief

| Brief stage | In Munshi |
| --- | --- |
| **Write** | Describe the receptionist in a text box (1,200-char limit, five use-case starters: Appointments, Lead generation, Support, Negotiation, Collections), or answer eight questions by voice. Gemini drafts a structured job card; the voice interview fills it live through ElevenLabs client tools. |
| **Review / edit** | Form-based job card editor (business, hours, prices, booking, languages, hand-off, never, if-unsure, greeting) plus a voice browser with previews. Zod validates the card before anything is created. |
| **Test** | Trial Day runs 8 ElevenLabs Agent Testing tests (next-reply, tool-call and simulation) with `repeat_count: 3` on the exact version. Live voice test mode in the browser shows the transcript, per-reply latency, tool calls, and supports interruptions. |
| **Refine** | Coach a failed test in one typed or spoken sentence (Scribe v2). Gemini turns it into a rule and a permanent test; Munshi creates a new version on its own ElevenLabs branch. Plain-language refine chat ("make the greeting shorter and warmer", "add Hindi") also creates tested versions. |
| **Deploy** | Go live merges the passing branch into main. Patients get a public talk link and an `<elevenlabs-convai>` web widget. Phone: connect a Twilio/SIP number to the same agent in ElevenLabs (documented in the Go live screen). |
| **Observe** | Call log with transcripts, ElevenLabs + Gemini summaries, outcome, sentiment, verified booking IDs, flagged calls, callbacks and upcoming bookings. Post-call webhook (HMAC-verified) or sync from the conversations API. |

## ElevenLabs features used

| Step | Capability | API |
| --- | --- | --- |
| Interview | Agents + client tools | `useConversation({ clientTools })` (`@elevenlabs/react`), signed URL from `GET /v1/convai/conversation/get-signed-url` |
| Create receptionist | Agents API + server (webhook) tools | `POST /v1/convai/tools`, `POST /v1/convai/agents/create` |
| Trial Day | Agent Testing (next reply, tool call, simulation with tool mocks), probabilistic runs | `POST /v1/convai/agent-testing/create`, `POST /v1/convai/agents/{id}/run-tests` (`repeat_count: 3`), `GET /v1/convai/test-invocations/{id}` |
| Coach / refine | Versioning: branches and immutable versions | `POST /v1/convai/agents/{id}/branches`, `PATCH /v1/convai/agents/{id}?branch_id=…` |
| Go live | Merge to main | `POST /v1/convai/agents/{id}/branches/{branch}/merge` |
| Voice | Flash v2.5 TTS (Hindi + English), Scribe ASR, voice library | `GET /v1/shared-voices`, `GET /v2/voices` |
| Spoken coaching | Scribe v2 speech to text | `POST /v1/speech-to-text` |
| Call log | Conversations + post-call webhook | `GET /v1/convai/conversations`, `POST /api/webhooks/elevenlabs` (ours) |

We use the current Agent Testing API, not the deprecated `simulate-conversation` endpoint.

## Architecture

```
Browser (Next.js 15, React 19, Tailwind 4, Three.js orb)
  │  signed URLs only, never an API key
  ▼
Munshi server (Next.js route handlers)
  ├─ Compiler        job card → system prompt, greeting, tools
  ├─ Test runner     8 tests × 3 runs, go-live gate
  ├─ Coach / refine  Gemini → rule → new branch → permanent test
  ├─ Booking tools   /api/tools/:clinic/{check-slots,book-slot,log-callback}  (shared-secret header)
  ├─ Call log        webhook in (HMAC) or conversations sync; booking IDs verified
  └─ MongoDB Atlas   clinics · versions · tests · runs · calls · bookings · callbacks
  ▼
ElevenLabs: Agents · Agent Testing · Versions · Scribe · Flash TTS · Conversations
```

Rules the code enforces:
- **No secret in the browser.** Voice sessions start from short-lived signed URLs.
- **No untested version live.** Go live checks the last run of that exact version: every blocker 3/3.
- **No fake bookings.** A booking exists only if `book_slot` returned a `bk_` ID from MongoDB; a unique index blocks double booking, and the call log flags any booking ID the agent said that isn't in the calendar.
- **Instant rollback.** Every version is its own branch; older versions stay intact.
- **Responsible AI.** Every greeting says it's an AI receptionist; it never gives medical advice and refuses prompt-injection.

## Run it

Requirements: Node 20+, a MongoDB Atlas cluster, an ElevenLabs API key, a Gemini API key.

```bash
npm install
cp env.example .env.local   # fill ELEVENLABS_API_KEY, GEMINI_API_KEY, MONGODB_URI, TOOL_SECRET, PUBLIC_BASE_URL
npm run dev
```

`PUBLIC_BASE_URL` must be reachable by ElevenLabs for the booking tools (the deployed URL, or a tunnel when running locally). In Atlas, allow the server's IP under Network Access.

### Deploy on Render

`render.yaml` defines the web service. Create it from the repo (Blueprint), add the environment variables from `env.example` in the Render dashboard, and set `PUBLIC_BASE_URL` to the Render URL.

## Project layout

```
src/app/            pages (/, /c/[id], /talk/[id], /demo) and API routes
src/components/     Builder, Orb (Three.js), voice hook, workspace steps
src/lib/            env, db (MongoDB), jobcard (Zod), compile, testpack, elevenlabs, gemini, calendar, workflow
public/prototype/   the original clickable prototype
public/demo/        the 90-second explainer video
```
