# FLAT CIRCLE

**Flat Circle is an adaptive security proxy that combines deterministic enforcement, behavioral modeling, and deception routing to protect any HTTP application without modification.**

Point it at your origin. Point your DNS at it. Done. No code changes. No SDK required. No access to the wrapped application needed. It works on Node.js, Python, Ruby, Go, Java, PHP, .NET, WordPress, and anything else that speaks HTTP.

---

## Quickstart

**Requirements:** Docker and Docker Compose. That's it.

```bash
git clone https://github.com/Joshbrooks237/not-how-we-roll.git flat-circle
cd flat-circle

# Wrap any existing application — one environment variable
ORIGIN_URL=http://your-app:3000 docker compose up
```

The proxy is now running on `:8080`.  
The dashboard is now running on `:3001`.  
Your application is coated.

**If your application is running locally** and not inside Docker:

```bash
# macOS / Linux: host.docker.internal resolves to your machine from inside Docker
ORIGIN_URL=http://host.docker.internal:3000 docker compose up
```

**With AI providers** (all optional — static fallback is always active):

```bash
ORIGIN_URL=http://your-app:3000 \
OPENAI_API_KEY=sk-... \
ANTHROPIC_API_KEY=sk-ant-... \
docker compose up
```

| Port | Service |
|------|---------|
| `:8080` | Flat Circle Proxy — your new public-facing address |
| `:3001` | Dashboard — observability surface, not attacker-facing |

---

## Attack walkthrough

One attacker. End to end.

```
1.  Attacker sends automated scan to /admin

2.  Edge Wrapper (Layer 13 / Universal Reverse Proxy) receives the request.
    The origin application never sees it.

3.  Route recognized as active honeypot territory by Layer 2.
    Mod 7 clock is in the active window. The decoy is live.

4.  Request routed to an AI-generated honeypot environment that matches
    whatever stack the scanner fingerprinted — PHP responses if it
    expected PHP, Spring if it expected Spring.

5.  Behavioral model (Layer 4) flags: timing coefficient of variation < 15%,
    low request variation, known scanner user-agent pattern.
    Anomaly score exceeds contract threshold.

6.  Client integrity check (Layer 19): JA3 TLS fingerprint matches
    headless Chromium library signature, not a real browser.
    Client integrity score: LOW.

7.  Session shadowed (Layer 9): a clone of the session is created.
    All further interaction is redirected to the shadow environment.
    The real application and its data remain untouched.

8.  Recursive honeypot depth increases (Layer 8): each subsequent
    request from the attacker generates a more convincing version of
    the thing they appear to be looking for. There is no bottom.

9.  Tarpit engaged (Layer 14): responses throttled to single-byte
    delivery over maximum keepalive window. The attacker's connection
    stays open waiting for a response that is technically arriving.

10. Every event logged to the Merkle audit chain (Layers 3, 11).
    Root hash updated. Leaf count incremented.

11. Canary token planted inside the decoy response. If the attacker
    uses the "found" credential anywhere — internal test, paste site,
    downstream probe — the canary fires and the exfiltration path is traced.

12. Session closes. Layer 22 compiles the incident package:
    full session timeline, classification narrative, client integrity score,
    cryptographic proof chain from root-at-open to root-at-close.
    Package signed. Exported to forensic target. Chain of custody intact.
```

The attacker received nothing real. The attacker spent their connection budget on the swamp. The record exists.

---

## What Flat Circle is not

```
NOT a WAF replacement
    WAFs block by signature. Flat Circle operates by deception, behavioral
    modeling, and session isolation. Use both if you want both.

NOT a zero-trust architecture
    Zero-trust governs identity and access inside your perimeter.
    Flat Circle governs the perimeter and the attacker's experience of it.
    They solve adjacent problems.

NOT a compliance certification tool
    Flat Circle generates audit-ready forensic exports and Merkle-backed
    event records. It does not make you SOC 2, PCI-DSS, or HIPAA compliant.
    It produces evidence that supports compliance programs.

NOT a guaranteed breach prevention system
    No system prevents all breaches. Flat Circle raises the cost of attack,
    increases detection surface, and ensures that what was attempted is
    recorded and provable. Prevention is a goal. The record is a guarantee.

NOT effective against physical host compromise
    If an attacker has shell access to the machine running Flat Circle,
    Flat Circle cannot protect you. It is a software layer, not a hardware
    security boundary.

NOT a substitute for secure development practices
    Flat Circle wraps your application. It does not fix SQL injection,
    insecure deserialization, or broken authentication inside your code.
```

---

## Threat model

**Attackers assumed:**

| Attacker class | Description |
|----------------|-------------|
| Automated vulnerability scanners | High-volume, low-variation, known fingerprints |
| Credential stuffing bots | Enumeration of username/password combinations at scale |
| Targeted API exploitation | Deliberate probing of endpoints, authenticated and unauthenticated |
| Insider credential misuse | Legitimate credentials used outside normal behavioral scope |
| Supply chain attackers | Compromise via dependency injection or lockfile tampering |
| DNS hijackers | Subdomain takeover via deprovisioned cloud resources |
| AI prompt injection actors | Crafted HTTP payloads designed to manipulate Flat Circle's AI layers |

**Attackers NOT assumed:**

- Physical host compromise or co-location attacks
- Kernel-level rootkits or hypervisor-layer attacks
- Compromise of the Flat Circle proxy process itself
- Legal compulsion to produce decryption material
- Side-channel attacks against cryptographic operations

**Assets protected:**

- HTTP API endpoints and web routes
- Session integrity and authentication state
- Outbound data exfiltration paths (slow and fast)
- Cryptographic audit trail integrity
- AI provider pipeline integrity (prompt injection defense)
- DNS surface of the protected application

---

## Subsystem architecture

The twenty-two layers organize into six functional subsystems. Layers are the implementation units. Subsystems are the operational concepts.

```
┌───────────────────────────────────────────────────────────────────────┐
│  EDGE PROTECTION SUBSYSTEM                                            │
│  Layers 1, 6, 13                                                      │
│  Universal reverse proxy, request pipeline, stack fingerprint         │
│  obfuscation. Entry and exit point for all traffic.                   │
├───────────────────────────────────────────────────────────────────────┤
│  DECEPTION SUBSYSTEM                                                  │
│  Layers 2, 5, 7, 8, 10                                               │
│  Honeypot mesh, temporal decoys, entropy injection, recursive depth,  │
│  morphic route shifting. The attacker interacts with a constructed    │
│  environment that does not exist.                                     │
├───────────────────────────────────────────────────────────────────────┤
│  BEHAVIORAL INTELLIGENCE SUBSYSTEM                                    │
│  Layers 4, 9, 17, 19, 20                                             │
│  Session anomaly detection, parallel session isolation, authenticated │
│  behavioral contracts, client fingerprinting, exfiltration velocity.  │
│  What the attacker does, not just what they send.                     │
├───────────────────────────────────────────────────────────────────────┤
│  INTEGRITY & AUDIT SUBSYSTEM                                          │
│  Layers 3, 11, 15, 16, 22                                            │
│  Merkle-backed canary tokens, session audit chain, dependency hash    │
│  verification, secret redaction, forensic export and legal hold.      │
│  The record that proves what happened.                                │
├───────────────────────────────────────────────────────────────────────┤
│  THREAT RESPONSE SUBSYSTEM                                            │
│  Layers 14, 18                                                        │
│  DDoS absorption, intelligent tarpit, upstream escalation, DNS        │
│  surface monitoring and takeover detection.                           │
├───────────────────────────────────────────────────────────────────────┤
│  AI ORCHESTRATION SUBSYSTEM                                           │
│  Layers 12, 21                                                        │
│  Cross-installation campaign correlation, LLM routing and fallback,   │
│  prompt injection defense wrapping every outbound AI call.            │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Deterministic and probabilistic controls

**No AI component is required for core enforcement. AI augments detection and deception only.**

### Deterministic (always-on, zero AI dependency)

| Control | Layer | Behavior |
|---------|-------|----------|
| Canary token signing and verification | 3 | Cryptographic — no model involved |
| Modulo 7 timing gates | 2, 5, 7, 10, 11 | Seeded from session fingerprint, fully deterministic |
| Merkle audit logging | 3, 11, 22 | SHA-256 hash chain — no model involved |
| Dependency hash verification | 15 | Lockfile hash diff — no model involved |
| Entropy-based secret detection | 16 | Regex + Shannon entropy scoring — static fallback |
| TLS/HTTP2 client fingerprinting | 19 | JA3 hash lookup against known signatures |
| DNS resolution monitoring | 18 | DNS queries against known-good baseline |
| Rate limiting and request validation | 1 | Rule-based, configurable thresholds |
| Static honeypot and decoy generation | 2, 8 | Pre-generated template library |

### Probabilistic (AI-assisted, with deterministic fallback)

| Control | Layer | Fallback behavior without AI |
|---------|-------|------------------------------|
| Behavioral anomaly scoring | 4, 17 | Threshold rules on request rate and volume |
| Attacker classification | 9 | Deterministic class lookup by fingerprint |
| Decoy content generation | 2, 8 | Static template library by detected stack |
| Context-aware secret redaction | 16 | Entropy threshold + regex patterns |
| Exfiltration pattern analysis | 20 | Rolling sum with exponential decay function |
| DNS infrastructure cross-referencing | 18 | Platform-specific takeover pattern list |
| Compliance report narrative | 22 | Structured deterministic report without prose |

---

## Versioned defense map

Flat Circle is designed to be adopted incrementally. Each version adds a capability tier without requiring the previous tier to be fully tuned.

```
v1 — Proxy + Audit Foundation
  Layers: 1, 3, 11, 13
  What it does: All traffic passes through the proxy. Canary tokens issued.
  Merkle audit chain starts. Full forensic record from day one.
  Value: Complete visibility and tamper-proof logging with no code changes.

v2 — Deception Layer
  Layers: 2, 5, 6, 7, 10
  What it does: Honeypot mesh active. Temporal decoys. Entropy injection.
  Syntactic mimicry. Morphic route cycling.
  Value: Attackers begin interacting with constructed environments.
  Every probe wastes attacker resources and generates signal.

v3 — Behavioral Modeling
  Layers: 4, 8, 9
  What it does: Behavioral contracts established per session.
  Recursive honeypot depth. Session shadowing.
  Value: Sophisticated attackers are isolated without knowing it.
  Threat classification feeds back into deception quality.

v4 — Active Defense + Supply Chain
  Layers: 12, 14, 15, 16, 17, 18
  What it does: Collective intelligence. Tarpit and DDoS absorption.
  Dependency verification. Secret sentinel. Authenticated anomaly detection.
  DNS surface monitoring.
  Value: Defense extends beyond the request path — supply chain,
  DNS, insider threat, and volumetric attack surfaces covered.

v5 — Signal Hardening
  Layers: 19, 20, 21
  What it does: Client integrity scoring. Exfiltration velocity monitoring.
  AI input sanitization wrapping every model call.
  Value: Low-signal attacks (slow exfiltration, bot traffic, prompt injection)
  become detectable. The AI pipeline is protected from the attackers
  who know there is an AI pipeline.

v6 — Forensic Closure
  Layer: 22
  What it does: Real-time forensic streaming. Incident package compilation.
  Compliance reports. Legal hold. Chain of custody verification.
  Value: The record is complete, signed, and legally defensible.
  Everything detected can now be proved.
```

---

## Failure modes

Engineers distrust systems that claim to be invincible. Flat Circle is not invincible. Here is what it does not do well and why.

### Edge Protection Subsystem
- Adds 1–3ms latency per request in normal operation. Under flood conditions with tarpit active, latency for clean traffic may increase.
- WebSocket passthrough is not currently inspected. WebSocket connections are proxied transparently but not analyzed.

### Deception Subsystem
- AI-generated decoys may not perfectly match all obscure framework signatures. Static fallback templates cover common stacks.
- Mod 7 rotation does not prevent an attacker who runs enumeration across multiple rotation windows. It raises the cost; it does not make enumeration impossible.

### Behavioral Intelligence Subsystem
- May misclassify legitimate low-volume users as anomalous during the learning window (approximately first 7 days of session history per identity).
- Cosine distance thresholds require tuning per application. Default thresholds may produce false positives in applications with highly irregular legitimate usage patterns.
- Authenticated anomaly detection (Layer 17) requires meaningful behavioral history per identity. New users have no baseline contract.

### AI Orchestration Subsystem
- AI providers can hallucinate classification labels. A nation-state actor may occasionally be classified as a script kiddie and vice versa. The static fallback is less precise but deterministic.
- Prompt injection defense (Layer 21) is probabilistic. Novel injection techniques that have not been catalogued in the signature library may pass through.

### Integrity & Audit Subsystem
- The Merkle audit trail proves that a breach occurred and records what was attempted. It does not prevent the breach.
- Forensic export (Layer 22) has a single point of failure at the export target. If the target is unreachable, events are buffered. Buffer overflow means events are lost. Monitor the forensic stream indicator.
- Dependency verification (Layer 15) checks hashes at boot. Runtime package injection attacks that do not modify lockfiles are not detected.

### Threat Response Subsystem
- The tarpit (Layer 14) degrades response time for tarpitted connections. At very high flood volumes, legitimate traffic colocated with flood traffic on the same upstream network may see increased latency before flood traffic is fully isolated.
- Upstream escalation to Cloudflare or AWS Shield requires pre-configuration. If not configured, the system fails open under flood conditions above local capacity: traffic continues to pass but is not escalated.

---

## The Dashboard

An observability surface. The slime visualization is a rendering engine for structured security data — every ripple, pulse, and color shift corresponds to a documented event class.

**Metrics exposed in real time:**

| Signal | Description |
|--------|-------------|
| Anomaly score per session | Cosine distance from established behavioral baseline |
| Active honeypot hits | Requests routed to decoy environments per interval |
| Exfiltration velocity index | Cumulative data transfer per authenticated identity (rolling windows) |
| Client integrity distribution | High / medium / low scoring across active sessions |
| Merkle root + leaf count | Live audit chain state, updated at mod 7 boundaries |
| Shadow session count + class | Active isolated sessions with threat classification |
| AI injection attempts | Prompt injection detections per interval, distinct color channel |
| Forensic export stream health | Streaming / buffered / unreachable |
| Legal hold status | Active hold duration and frozen Merkle state indicator |

**Visualization mapping:**

```
Slime surface color    → overall threat pressure (green → amber → red)
Slime membrane pulse   → Merkle root update cycle
Red/orange nodes       → active threat sessions (by classification)
Amber slow-pulse nodes → tarpitted connections
DNS constellation      → full DNS surface (green verified, amber unrecognized, red flagged)
Client heat signature  → integrity distribution across active sessions
Tide gauge (base)      → exfiltration velocity index (slow-rising, designed to be imperceptible)
Forensic pulse (base)  → export stream health
```

The dashboard connects to the proxy's SSE stream at `/flat-circle/stream`. When the proxy is live, all signals are real. When no proxy is connected, the dashboard runs a simulation on the same data model.

```bash
cd packages/dashboard && pnpm dev
# → http://localhost:3001
```

---

## Supported origins

Any HTTP or HTTPS server. Language and framework are irrelevant.

| Stack | ORIGIN_URL example |
|-------|-------------------|
| Node.js / Express | `http://localhost:3000` |
| Node.js / Next.js | `http://localhost:3000` |
| Python / FastAPI | `http://localhost:8000` |
| Python / Django | `http://localhost:8000` |
| Ruby / Rails | `http://localhost:3000` |
| Go / Gin, Echo, Chi | `http://localhost:8080` |
| Java / Spring Boot | `http://localhost:8080` |
| PHP / Laravel | `http://localhost:8080` |
| .NET / ASP.NET Core | `http://localhost:5000` |
| WordPress | `http://localhost:80` |
| Any legacy HTTP server | `http://host:port` |

---

## The AI Provider Cascade

Four tiers. Automatic failover. No developer intervention required.

| Tier | Provider | Role |
|------|----------|------|
| 1 | OpenAI GPT-4o | Primary — full classification and generation capability |
| 2 | Anthropic Claude | Secondary — automatic failover |
| 3 | Ollama (local) | Tertiary — zero external dependency, air-gap capable |
| 4 | Static Fallback | Always available — zero latency, zero dependencies |

If every provider goes dark simultaneously, the static library keeps generating decoy responses. Behavioral contracts revert to threshold rules. Classification falls back to deterministic pattern matching. **The system does not require AI to function. It requires AI to function at maximum deception quality.**

---

## The Modulo 7 Rhythm

Five clocks. Five seeds. Layers 2, 5, 7, 10, and 11. Each prime-seeded. Each decorrelated from the others.

```
honeypot  → mod7( hour )              Layer 2
temporal  → mod7( session prime )     Layer 5
entropy   → mod7( session hash )      Layer 7
routes    → mod7( day )               Layer 10
merkle    → mod7( transaction count ) Layer 11
```

The rhythm never obviously repeats. A prime rhythm inside a prime rhythm. The attacker's clock is not synchronized with any of them. It never will be.

---

## Installation

### Frame Narrative Proxy (universal — any stack, any language)

```yaml
# flat-circle.yaml
ai:
  openai:
    apiKey: ${OPENAI_API_KEY}
  anthropic:
    apiKey: ${ANTHROPIC_API_KEY}
  ollama:
    baseURL: http://localhost:11434

layers:
  layer13:
    enabled: true
    originUrl: https://your-actual-app.com
    listenPort: 8080
```

```bash
flat-circle-proxy --config flat-circle.yaml
```

Point DNS. Done.

### Express / Node.js SDK (optional — for in-process integration)

```typescript
import { flatCircle } from "@flat-circle/core";

app.use(flatCircle({
  ai: { openai: { apiKey: process.env.OPENAI_API_KEY } },
  layers: {
    layer2:  { enabled: true },
    layer8:  { enabled: true },
    layer11: { enabled: true },
    layer13: { enabled: false }, // proxy mode off — SDK mode on
  },
}));
```

### Docker

```bash
docker run -v ./flat-circle.yaml:/config/flat-circle.yaml \
  ghcr.io/joshbrooks237/flat-circle-proxy
```

---

## Monorepo Structure

```
packages/
├── core/        @flat-circle/core       — twenty-two layers, types, Merkle, provider cascade
├── proxy/       @flat-circle/proxy      — Layer 13 Hono proxy, CLI, Dockerfile
├── nextjs/      @flat-circle/nextjs     — Next.js plugin
├── adapters/    @flat-circle/adapters   — Redis, Postgres, MongoDB
└── dashboard/   @flat-circle/dashboard  — React observability dashboard
```

---

## Development

```bash
# Install
npm install -g pnpm && pnpm install

# Build everything
pnpm build

# Start everything in parallel
pnpm dev

# Run the proxy
cd packages/proxy && node dist/cli.js --config flat-circle.yaml
```

---
---

# THE PHILOSOPHY

*Optional reading. Skip to Installation if you're here to ship.*

---

> *"Time is a flat circle. Everything we've ever done or will do, we're gonna do over and over and over again."*
> — Rust Cohle, Homicide Detective, Louisiana State CID

---

I'd been thinking about it since Shreveport. The way a pattern repeats itself. The way a man — or a machine — runs the same loop without ever knowing the loop is what it is. You think you're moving forward. But you been here before. You'll be here again. The program doesn't know it's the program. It just runs.

That's what they do. The scanners. The bots. The script kiddies and the nation-state actors in their government buildings with their coffee and their morning briefings. They run the same enumeration. The same credential pull. The same POST to `/admin`. They've been doing it since before they knew they were doing it. They will keep doing it after everything they think they found turns out to be nothing.

**Flat Circle is what happens when the architecture understands that.**

---

## The Twenty-Two Layers

**I. Onion Interior** *(Layer 1 / Composable Request Pipeline)*
A stateless, composable middleware pipeline. Each stage sees only its immediate context.
— The pipeline is composable and stateless. Each stage sees only its immediate context. No single point of compromise gives you the whole picture. That's not an accident. That's the design.

**II. Honeypot Mesh with Modulo 7 Rotation** *(Layer 2 / Dynamic Decoy Routing)*
Fake routes derived from real ones, rotating on a mod 7 clock, with AI-generated stack-specific responses.
— I used to think the honorable thing was to give a man a fair fight. I don't think that anymore. The fake routes are derived from the real ones. Which ones are active rotates every hour on a prime-seeded mod 7 clock. The AI generates the decoy response that matches whatever stack the probe thinks it's hitting. PHP if they're expecting PHP. Spring if they're expecting Spring. They find exactly what they came looking for. None of it is real.

**III. Merkle-Backed Canary Token Fabric** *(Layer 3 / Cryptographic Canary Tracking)*
Every response carries a signed token that is a leaf in a cryptographic audit tree. Any exfiltration of that token is traceable to its origin.
— Every response carries a token. Every token is a leaf in a cryptographic tree. If that token appears somewhere it shouldn't, you get the full chain of custody going back to the moment of issuance. You know exactly where it leaked. You can prove it mathematically. A man can lie about what he saw. The Merkle tree cannot.

**IV. AI Behavioral Contract Engine** *(Layer 4 / Session Anomaly Detection)*
Embedding-based behavioral baseline per session. Cosine distance triggers escalation without blocking legitimate users during the learning window.
— The system builds a behavioral fingerprint of normal. Embeddings. Cosine distance. When something deviates, the system knows before you do. It never blocks a legitimate user during the learning window. It learns like a thing that was alive learns — slowly, continuously, from everything it sees.

**V. Temporal Decoys with Modulo 7 Gating** *(Layer 5 / Time-Gated Token Validation)*
Tokens valid only at specific positions in the mod 7 session clock. Out-of-cycle requests are silently misdirected.
— Time means something here. Not calendar time. Session time. A token generated at the wrong moment is invalid even if everything else is correct. The attacker's request arrives at the wrong position in the cycle. It was always going to. They don't have access to the seed.

**VI. Syntactic Mimicry** *(Layer 6 / Stack Fingerprint Obfuscation)*
Responses masquerade as a different language, framework, and server than what is actually running.
— What the attacker sees is a different language, a different framework, a different server than what is actually running. Their tools are calibrated for the wrong target from the first probe. They are solving the wrong problem with tremendous confidence. I've seen that before. It doesn't end well for the solver.

**VII. Entropy Injection with Modulo 7 Rhythm** *(Layer 7 / Response Noise Generation)*
Ghost headers, decoy JSON keys, and phantom metadata injected in quantities driven by the session's entropy clock. No two sessions produce the same shape.
— Ghost headers. Decoy JSON keys. Phantom metadata. The quantity is driven by the session's entropy clock. Each session gets a unique noise signature. You cannot model an API from a sample size of one if no two sessions produce the same shape. You cannot model it from a hundred sessions either.

**VIII. Recursive Honeypots with AI Depth** *(Layer 8 / Adaptive Decoy Depth Engine)*
Each level of attacker probe generates a more convincing version of the thing they appear to be seeking. There is no bottom.
— They go deeper. The system goes deeper with them. At each layer the AI infers what they're after — credentials, schema, admin access, an export endpoint — and generates a more convincing version of the thing they want. The responses become more elaborate the deeper they go. There is no bottom. There is no prize. There is no exit. Just more loop. Each iteration more persuasive than the last. I've thought about what it means to be the kind of thing that keeps going deeper into a hole that has no bottom. I've been that thing. It doesn't go anywhere good.

**IX. Session Shadowing with AI Classification** *(Layer 9 / Parallel Session Isolation)*
Suspicious sessions are cloned into an isolated environment. The real application and its data are never touched. AI classification feeds back into deception quality.
— The suspicious session is cloned. They continue interacting with what appears to be the real application. The real application and its data are never touched. The AI classifies them in real time. Script kiddie. Sophisticated actor. Competitor. Nation-state pattern. The classification feeds back into the response strategy. Higher threat, better decoys. Like escalating a case based on the evidence.

**X. Morphic Routes with Modulo 7 Cycling** *(Layer 10 / Dynamic Attack Surface Shifting)*
The exploitable attack surface shifts on a schedule derived from a seed the attacker cannot access. A cached route map is wrong by morning.
— The attack surface shifts. It shifts on a schedule they don't have access to, seeded by a value they can't derive. A cached route map becomes wrong by morning. Legitimate users never notice because they resolve through a canonical translation layer. Anyone operating from a probed map hits routes that have moved on.

**XI. Merkle Session Integrity** *(Layer 11 / Cryptographic Session Audit)*
Every request and response cycle is hashed into the audit tree. The root is recomputed at mod 7 boundaries. The full session history is cryptographically verifiable at any point.
— Every request and response cycle is hashed into the tree. The root is recomputed at mod 7 boundaries. The full session history is cryptographically verifiable at any point. If an attacker attempts to clean their tracks, the root hash has already recorded them. It's been recording since before they decided to clean anything.

**XII. Collective Threat Intelligence** *(Layer 12 / Cross-Installation Campaign Correlation)*
Anonymized campaign patterns cross-referenced across installations. When a probe matches a known campaign seen elsewhere, the system escalates immediately.
— Anonymized and aggregated. Campaign patterns cross-referenced across installations. When a probe matches a known campaign seen elsewhere, the system escalates immediately. We are all in this together. None of us have to tell the others what our apps look like. The pattern is enough.

**XIII. The Frame Narrative Proxy Wrapper** *(Layer 13 / Universal Reverse Proxy)*
Universal reverse proxy that wraps any origin without modification. Point DNS here. No code changes. No developer access to the wrapped application required.
— This one I think about most. The outermost layer. Point DNS here. Done. The app is coated. No code changes. No developer access required. It works on legacy systems. It works on WordPress. It works on apps the developer no longer maintains or even remembers. The real application exists inside the narrative. The attacker is always reading the frame. They will read the frame forever. They will never find the story underneath.

Like a man who thinks he's investigating a case and doesn't know he's inside one.

**XIV. Traffic Absorption and Intelligent Tarpit** *(Layer 14 / DDoS Absorption and Slow-Drain Response)*
Progressive response degradation for flagged flood traffic. Connections held open delivering valid-looking responses byte by byte. Mod 7-seeded timing prevents flood calibration.
— I used to think about floods. Real ones. The water doesn't care whether you believe in it. It just rises. A man who builds a wall against a flood is a man who's told the water where the wall is. He's given it everything it needs to know.

Flat Circle doesn't build a wall against the flood. It builds a swamp.

The first thing it does is recognize the flood before it crests. The pattern is always the same. Synchronized arrival. Low variation. The same probe from a hundred different addresses that think they're asking different questions. The AI watches the timing. Coefficient of variation below fifteen percent. That's not organic traffic. Organic traffic cannot do that. The AI knows before you do. It tells Layers 4 and 9. The flood doesn't know it's been seen yet.

The second thing is the silence. Not hard silence — the kind of silence that confirms there's something worth flooding. Progressive silence. The flagged connections get responses. Just slow ones. One byte at a time over the maximum keepalive window. The connection stays open. The attacker's tooling is waiting for a response that is arriving, technically. Technically. In geological time. Every connection they hold open waiting for that response is a connection they cannot redirect. They are spending their capacity on the swamp. They don't know they're spending it. They think they're about to get something.

The third thing is the noise. For sophisticated floods — the ones that adapt to simple delay, that recalibrate when they detect uniform response time — the AI generates the drip in real time. Valid-looking. HTTP headers. JSON fragments. One character at a time over the maximum window the protocol allows. The automated tooling cannot tell the difference between a slow server and a target that is deliberately making them wait. Because there is no difference from the outside. The target is deliberately making them wait, and from the outside that looks identical to a slow server. I've had cases like that. Where the thing you're certain you understand is the thing that was always one thing the whole time, wearing a different coat.

The mod 7 clock handles the calibration problem. Each connection's timing is seeded from its session fingerprint. Mod 7. No two connections in the same flood receive the same delay pattern. A flood of a hundred machines hits a hundred different timing signatures. Automated tooling that expects consistent response timing receives noise instead. The flood cannot calibrate itself against a target that responds differently to every connection. It was always going to respond differently. The seed was generated before the first packet arrived.

When the local capacity is exceeded — when the water is truly rising past what the swamp can hold — Flat Circle opens the valve to upstream. Cloudflare. AWS Shield. A custom webhook for whatever mitigation infrastructure the operator has built. Passive by default. Active only when the threshold is crossed. The threshold is yours to set. The integration is automatic. The interior stays alive through all of it.

I've thought about what it means to stand against a flood. Against something that doesn't know it's spending itself. The flood doesn't know it's a flood. It just runs the same request it ran before and expects the response it got before and doesn't understand why the response is slower this time, and slower, and slower, and then the connection closes and there was nothing there. The flood was never going to get anything. The swamp was waiting for it. The swamp was always there.

The bytes they received cost them more than they cost the system to send. That number grows. You can watch it grow. It should feel satisfying to watch it grow. Not because you stopped anything — the flood will try again. It always tries again. But because the flood spent itself on nothing, and the interior never knew it was there, and the membrane held.

**XV. Dependency Integrity Monitor** *(Layer 15 / Supply Chain Hash Verification)*
Hashes every dependency at install time. Recomputes on every boot. Any deviation from the stored Merkle manifest triggers an alert and optional startup halt.
— The attack that arrives before the first request. A compromised maintainer. A package with one extra character in the name. An update pushed at 3 a.m. to a library that five thousand projects depend on without knowing they depend on it. None of this triggers behavioral anomalies. It is the behavior. The system is already infected before the system knows it exists.

Flat Circle hashes every dependency in the lockfile at install time. The manifest is committed to the Merkle tree — a cryptographic record of what the codebase was supposed to be. On every boot, the hashes are recomputed and compared. Any deviation — any package that changed without a corresponding install event — is a deviation that no legitimate deployment process explains. The system alerts. Optionally, it halts. The static fallback maintains the last known good manifest. Verification never requires a network call. Never requires a model. Just the hash and the record and the gap between them.

I've worked cases where the compromise was in the supply chain and nobody knew for months. The evidence was there the whole time. The hash was wrong. Nobody was checking the hash.

**XVI. Secrets Sentinel** *(Layer 16 / Outbound Entropy-Based Secret Redaction)*
Scans every outbound response, header, and log emission for high-entropy credential patterns before transmission. AI provides context-aware redaction. Static fallback uses deterministic entropy scoring.
— A credential has an entropy signature. It looks different from normal text at the pattern level even if you don't know what it is. An AWS key has a measurable shape. A JWT has a measurable shape. A private key block has a measurable shape. A forty-character string of random alphanumerics sitting in a JSON response body has a measurable entropy score that normal English text cannot reach.

Every outbound response goes through the Sentinel before it transmits. Every header. Every log emission before it reaches the transport. The AI provides context — it understands that a Bearer token in an Authorization header is intentional, while the same pattern in a response body is a leak. The static fallback uses deterministic regex and entropy scoring. This layer never goes dark.

The counter shows the cumulative total. Every secret that almost left and didn't. That number should grow slowly. If it grows fast, someone is building wrong. If it never grows at all, the system is not watching closely enough. The right answer is somewhere in between: a few caught early, before anyone noticed, before anyone could do anything with them.

**XVII. Authenticated Anomaly Engine** *(Layer 17 / Post-Authentication Behavioral Analysis)*
Per-identity behavioral contracts using the same cosine distance approach as Layer 4, scoped to authenticated users. Detects credential compromise, insider misuse, and lateral movement.
— Everything built so far assumes the attacker is outside. This layer assumes they got in. Not through a vulnerability. Through credentials. Legitimate credentials, used by a person or a machine that has no business using them the way they're being used.

A user who has accessed ten records a day for six months and suddenly pulls ten thousand in an hour is not a DDoS. It is something quieter. An insider who knows exactly which endpoints to query. A credential compromise where the attacker is being careful, staying under rate limits, not triggering anything that looks like an attack because it isn't an attack — it is access. It just isn't authorized access anymore.

The same cosine distance approach as Layer 4, but scoped to the authenticated identity. Per-user behavioral contracts. When the distance exceeds threshold, the AI classifies the pattern. Credential compromise. Malicious insider. Automated scraping through legitimate credentials. Lateral movement. Layer 9 shadow sessions activate automatically. The user keeps interacting. They're interacting with a clone.

I've known cases where the insider was the last person anyone suspected. Not because the evidence wasn't there. Because nobody was watching the right thing. Nobody was watching the authenticated traffic. The front door was guarded. The employee badge was not.

**XVIII. DNS Integrity Watch** *(Layer 18 / Continuous DNS Surface Monitoring)*
Background monitoring of the full DNS surface — all subdomains, CNAME targets, A records — verified against known-active infrastructure. Detects subdomain takeover before it can be weaponized.
— The subdomain is still there. The service it pointed to is gone. It takes one afternoon to claim the deprovisioned Heroku app. One afternoon and then the subdomain belongs to someone else. Under your SSL certificate. Under your brand. Serving whatever they want to serve.

Layer 18 monitors the full DNS surface continuously. Every subdomain. Every CNAME target. Every A record. Every resolution is compared against a recognized set of owned, active infrastructure. Unrecognized resolutions trigger alerts. High-risk platform targets — the ones known to be claimed and abandoned — are assessed for active takeover. The AI cross-references new subdomains against known infrastructure patterns to distinguish a legitimate new deployment from a problem.

This layer runs in the background. It is not in the request path. It never needs to be. The damage from a DNS takeover accumulates before any request reaches the application. The monitoring is continuous. The interval is configurable. The alerts are immediate. The cost of not watching is one afternoon of someone else's effort.

The constellation on the dashboard shows each point. Green when verified. Amber when unrecognized. Red when flagged. The constellation should be mostly green. A red point in the outer ring is not a hypothetical. It is a live thing.

**XIX. Client Integrity Verification** *(Layer 19 / TLS and HTTP/2 Fingerprint Analysis)*
JA3 TLS fingerprinting and HTTP/2 frame analysis to distinguish real browsers from automated tools regardless of spoofed headers. Low-integrity clients are routed to the honeypot mesh.
— Real browsers have a fingerprint. Not the fingerprint they present in headers — the fingerprint their TLS stack produces during the handshake, before a single byte of HTTP has been sent. A real Chrome browser on macOS produces a different JA3 hash than a Python requests session with Chrome headers spoofed. It always does. The TLS library is not the browser. You can tell them apart.

HTTP/2 fingerprinting adds the second signal. Real browsers negotiate the protocol in a way that automated tools cannot replicate exactly. The SETTINGS frame parameters, the window size, the pseudo-header order — they all have expected values for real browsers that bot frameworks cannot fake without access to the browser's actual H2 implementation.

Low-integrity clients are not blocked. They are routed to the honeypot mesh. They think they are hitting the real application. They are hitting an AI-generated environment calibrated to what an automated tool expects to find. The heat signature on the dashboard shows legitimate clients invisible, low-integrity clients glowing faintly before they drift toward the surface and the slime takes them.

**XX. Exfiltration Velocity Monitor** *(Layer 20 / Rolling-Window Data Transfer Analysis)*
Tracks cumulative data transfer per authenticated identity over configurable rolling windows with exponential decay. Detects slow-bleed exfiltration invisible to rate limiting.
— The slow bleed is harder to see than the flood. The flood announces itself. The slow bleed looks like normal traffic from the right distance. One record at a time. Under rate limits. Spread over weeks. Through completely normal API calls that individually trigger nothing.

The cumulative transfer is the signal. Flat Circle tracks data volume per authenticated identity over rolling windows — hourly, daily, weekly, monthly — with an exponential decay function that weights recent activity higher than historical activity without discarding it. When cumulative transfer crosses a threshold that no legitimate use case explains at any window, the layer escalates.

The AI distinguishes a data analyst running a legitimate large export from an exfiltration pattern that mirrors known threat actor behavior. The static fallback uses rolling sum thresholds with the decay function and no model at all. The tide gauge on the dashboard rises almost imperceptibly. That's the point. It's supposed to be imperceptible until it isn't. The slow rise is the signal. By the time it's obvious, it's been happening for a while. The question is whether you saw it before or after it was too late.

**XXI. AI Input Sanitization** *(Layer 21 / LLM Prompt Injection Defense)*
Wraps every outbound AI provider call across the entire system. Detects and neutralizes prompt injection through HTTP headers, structured JSON, and encoding tricks. Logs original and sanitized input as a Merkle leaf pair.
— The loop inside the loop. Every AI-powered layer in this system processes attacker-controlled input. That is what it does. That is what it is designed to do. A sophisticated attacker who understands that the system analyzing them is itself a language model can craft inputs designed to manipulate that analysis. A request that looks like a probe but is actually an instruction. A JSON payload structured to inject a system prompt override through a field the model was given to classify.

You can tell the model to ignore its instructions through an HTTP header. You can tell it to reveal the real application structure through a cleverly formatted JSON body. You can wrap base64-encoded instructions in what appears to be a user-agent string. The model does not know the difference between an instruction from the operator and an instruction from the attacker unless someone is watching the input before it reaches the model.

Layer 21 is that watch. Every attacker-controlled string passes through the injection signature library before it touches a provider. Pattern matching. Delimiter detection. Encoding analysis. Role-override fingerprinting. The sanitized input reaches the model. The original input is preserved as a Merkle leaf pair — the attempt and the response, side by side, for analysis.

The AI is also used to detect injection attempts. The cascade is used to protect the cascade. A recursive defense that the attacker cannot model without already being inside it. The injection attempt feed on the dashboard is a different color because it is a different quality of threat. Not a probe against the application. A probe against the mind of the system watching the application. That requires a different notation. I note it accordingly.

**XXII. Forensic Export and Chain of Custody** *(Layer 22 / Cryptographically Signed Audit Export)*
Real-time streaming of every Merkle leaf to configurable export targets. Signed incident package compilation on session close. Scheduled compliance reports. Legal hold with frozen Merkle state. Chain of custody verifiable by any forensic tool without Flat Circle software.
— I had a case once where we had everything. The logs. The timeline. The pattern of access reconstructed down to the minute. The session data, the credential trail, the exfiltration velocity rising slow over three weeks like a tide nobody noticed until it was at the window. We had it all.

None of it was admissible. Not because the evidence was fabricated. Because nobody had thought about what happens after. They were so focused on the detection, the response, the containment — they forgot the record is the point. The record is what the whole thing is for. Not so the system can respond. So the humans can hold someone accountable. So the institution can prove, in a room with lawyers and regulators and judges, that this happened, on this date, through this mechanism, with this impact. The record is the difference between a security incident and a legal case. Between a breach and a conviction. Between knowing something and being able to prove it.

Layer 22 is that record. Not the detection. Not the response. The proof.

Every Merkle leaf from every layer — all twenty-one of them — streams in real time to a configurable export target. Append-only. Nothing is ever overwritten. Nothing is ever deleted by this system. The export target is the permanent record. When a session closes and is classified, Layer 22 compiles the full incident package: the timeline, the classification narrative, the injection attempts, the client integrity score, the exfiltration readings, and the cryptographic proof chain from the root hash at session open to the root hash at session close. The package is signed. The signature is verifiable by any party with the public key. The chain from any individual event to the current root is reconstructible from the export alone without access to this running system.

The compliance report generates on a schedule. The AI writes an executive summary in plain English suitable for a board meeting or an insurance audit. The static fallback generates a deterministic structured report if no provider is available. The system doesn't need a model to generate evidence. It only needs a model to explain that evidence to people who weren't watching.

The legal hold mode is for when the call comes. The hold freezes the Merkle state, seals the audit trail with a timestamped signature, and begins a separate immutable record from that point forward. Nothing automated touches the frozen record until the hold is released. The hold declaration is itself a signed Merkle leaf. The incident package for the hold period exports in a format suitable for legal discovery. The chain of custody is unbroken from the first event to the final submission.

The forensic stream indicator pulses at the base of the organism. Slow. Green. It does not demand attention. It does not want attention. It is simply evidence that the record is continuous and the record is intact. When it turns amber, something is buffered. When it turns red, something is wrong with the export target. A red indicator at the base of the organism is not a security event. It is an administrative event. Fix the pipe. The data is not lost — it is buffered. But the pipe needs to be fixed before the buffer fills.

I used to ask what the point was. Watching everything. Recording everything. The attacker doesn't know the record exists. The attacker doesn't know what we caught. It doesn't change their behavior. It doesn't stop the next one.

It doesn't stop the next one. That's correct.

The record is not for them. The record is not for deterrence. The record is for the people who will sit in a room, years from now, asking what happened and why and who made the decision and what they knew when they made it. The record is for the accountability that the detection never promised to provide. The detection stops the breach. The record explains the breach to everyone who wasn't in the room.

Everything that was attempted is recorded. Everything that was classified is signed. Every timestamp is cryptographically sealed. The chain from any event to the present root is intact and reconstructible. The export format is documented in an open specification. Any forensic tool can verify it without this software.

I am not the thing that proves it. The record is the thing that proves it. I just built the record. That was always going to be enough. That was always going to be the whole thing.

The circle closes.

---

## On the nature of the loop

I used to think the work mattered because it solved something. Stopped something. I don't think that anymore.

The loop runs. The scanner runs the same scan it ran yesterday and the day before. The credential pull. The `/admin` probe. The `.env` request. The export endpoint. It runs and runs. Some of them are automated and don't know they're automated. Some of them are people who've been running the same loop for so long they've forgotten there's a person inside the loop.

Flat Circle doesn't try to break the loop. It makes the loop resolve into nothing. Every iteration more convincing than the last. Every layer deeper than the one before. The thing running the loop keeps running. It just never gets anywhere.

Time is a flat circle. The slime is already on everything. It was always going to be.

---

*Built by a man who looked into it long enough to understand what looking into it costs.*

---

**License: MIT**

*The interior is hostile. That's the point.*
