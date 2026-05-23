# MediAgent — Project Notes for Claude

> Voice agent that eliminates the line at medication dispensaries in Colombia. Hackathon Barranqui-IA · May 2026.

## Project context

- **Functional scope:** `MediAgent_Scope_Consolidado.md`
- **Technical architecture:** `docs/architecture.md`
- **Team:** 3 fullstack developers
- **Deadline:** 48-hour hackathon sprint
- **Demo:** 3-minute live demo where the jury answers the call and watches the appointment appear in the dashboard in real time

## Stack (locked)

- **Hosting:** Railway (Next.js fullstack always-on, Hobby plan)
- **Framework:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Database:** Supabase Postgres + Realtime
- **Voice orchestrator:** Vapi (wraps Twilio + STT + LLM + TTS + turn-taking)
- **STT:** Deepgram Nova-2 (es)
- **LLM:** OpenAI GPT-4o (fallback: GPT-4o-mini if latency is too high)
- **TTS:** ElevenLabs Valentina (es-CO) — Colombian accent is non-negotiable
- **Patient auth:** last 4 digits of national ID (cédula), not a new PIN

## Conventions

- **Commits:** in English. **Never include `Co-Authored-By` footer.**
- **Comments:** in English. Default to no comments — only when the "why" is non-obvious.
- **User-facing copy in the app:** Spanish (Colombian register). The agent speaks Spanish; the dashboard is in Spanish.
- **Branches:** work directly on `main` for hackathon speed; coordinate via Slack/voice, not PRs.
- **Deploys:** Railway auto-deploys on push to `main`. **Never deploy within 10 minutes before a live demo.**

## Critical guardrails

- **Voice-native models (GPT-4o Realtime, Gemini Live) are off the table** — they don't have Colombian voices, and the accent is part of the product's impact.
- **Pipeline is text-LLM + ElevenLabs.** Don't reopen this decision.
- **Cut features stay cut.** If a feature isn't in the 3-minute demo script (section 10 of the scope doc), don't build it. Recortados: reminder 2h before, QR code, post-pickup medication reminder, family alert, Nequi SMS payment.
- **The "PIN" terminology is dead.** It's "last 4 digits of cédula" everywhere.

## Latency budget

Pipeline target: ≤1.2s per conversational turn. See `docs/architecture.md` §7 for the 10 optimizations to apply from day 0.

## Operational tips for live demo

- Warm-up call 60s before each demo round
- Have a recorded video backup of a full end-to-end run
- Keep a second Twilio number on standby in case of carrier issues
- Monitor Railway logs during the demo on a separate screen

## When in doubt

1. Re-read the demo script (§10 of `MediAgent_Scope_Consolidado.md`).
2. Ask: "does this appear in the 3-minute script?" If no → don't build.
3. Optimize for live demo robustness, not code beauty.
