# eQRA — Ham Radio Field Card

> Built by a ham, for hams — vibe-coded with Claude Code.

**[→ Try it live at e-qra.vercel.app](https://e-qra.vercel.app)** · Open Beta · Free · Open Source

---

eQRA started as a personal tool: KO6JES needed a fast way to pull complete repeater data into [Gaia GPS](https://www.gaiagps.com/) while mobile. One lookup returns a full field card — frequency, CTCSS tone, coverage, nets, emergency affiliations, coordinates — ready to copy into Gaia as a waypoint.

It became a showcase of what **Claude Code vibe coding** can produce: a live, deployed, open-source web app built through conversational AI development.

---

## What It Does

Enter a callsign, frequency + location, or area name. eQRA returns structured field cards with:

- Output/input frequency, offset, and CTCSS/DCS tones (TX and RX)
- Coverage area, elevation, and GPS coordinates (Gaia-ready)
- EchoLink, AllStar, and Broadcastify links
- Emergency affiliations (RACES, ARES, SKYWARN)
- Sponsor, trustee, radio nets, and last verified date

Frequency + location queries scan all repeaters within a **50-mile radius** — across county and state lines.

---

## Example Output

Query: `N6MRN`

```
◉ N6MRN | Santa Rosa Mtn, Riverside County | 2m FM
RX: 145.34000 MHz | TX: 144.74000 MHz | Offset: -0.600 MHz | Tone TX: 107.2 Hz | Tone RX: NOT LISTED
Bearing: NOT LISTED | Coverage: San Jacinto Mtns, Indio, Hemet, greater Southwestern Riverside County
Coords: 33.54560, -116.46900

VOIP PLATFORMS:
EchoLink: NOT LISTED | AllStar: NOT LISTED | Broadcastify: NOT LISTED

Last Verified: 2025-04-15 | Status: ACTIVE 🟢

Official Callsign: N6MRN
Sponsor: Mile High Radio Club
Trustee: Tom Unwin, WA6SSS
Coordinator: Southern Cal FM Society (SCFMS)
Classification: RACES, SKYWARN
Special Notes: Linked full-time to 447.48000 (N6MRN) at Pine Cove, CA.

Grid Square: DM13sn | RepeaterBook ID: 361
HT CHANNEL NAME: N6MRN SANTA ROSA
GAIA WAYPOINT NAME: ◉ N6MRN 145.340
GAIA FOLDER: Mountain Radio Network / Orange
```

---

## How to Use

No install needed. Go to **[e-qra.vercel.app](https://e-qra.vercel.app)** and enter:

| Query type | Example |
|---|---|
| Repeater callsign | `N6MRN` |
| Club callsign | `AA6DP` |
| Frequency + city | `146.925 orange county` |
| Frequency + GPS | `146.925 33.711,-117.534` |
| Tap ◎ button | Uses your current location |

> Results are AI-generated. Always verify critical data with [RepeaterBook](https://www.repeaterbook.com) or your regional frequency coordinator before relying on it in the field.

---

## Usage Limit

**1 lookup per day** on the hosted app. I'm personally covering the API costs — the daily limit keeps it sustainable. Need more lookups? Self-host it with your own Gemini API key (free instructions below).

---

## Self-Hosting

```bash
git clone https://github.com/intenogent/eqra.git
cd eqra
npm install
```

Set these environment variables (Vercel dashboard or local `.env`):

```
GEMINI_API_KEY=your_google_ai_studio_key
BYPASS_SECRET=choose_any_secret_word
DAILY_LIMIT=10
```

`BYPASS_SECRET` — a private word you choose. Prefix any query with it to bypass the daily limit during testing (e.g. `mysecret N6MRN`). Never share or commit this value.

Deploy to Vercel:

```bash
npm i -g vercel
vercel --prod
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com). Enable billing for production use — queries cost fractions of a cent at this volume.

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI + Search | Google Gemini 2.5 Flash (native grounding) |
| Runtime | Node.js 22 (ESM) |
| Hosting | Vercel serverless |
| Frontend | Vanilla HTML + CSS + JS — no framework, no build step |
| Built with | [Claude Code](https://claude.ai/code) |

---

## About

eQRA is a vibe coding experiment — built by **Arshia (Intenogent) · KO6JES** using Claude Code to demonstrate what AI-assisted development can produce for a real-world use case. The entire project — architecture, code, prompts, testing, and deployment — was built through conversational development with Claude.

From a personal Gaia GPS field tool to a public open-source app. 73 de KO6JES.

---

## License

MIT © 2026 Arshia (Intenogent) · KO6JES
