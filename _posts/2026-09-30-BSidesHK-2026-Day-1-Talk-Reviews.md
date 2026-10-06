---
title: "BSidesHK 2026 Day 1 Talk Reviews"
date: 2026-09-30 12:00:00 +0000
slug: "BSidesHK-2026-Day-1-Talk-Reviews"
tags: [BSides HK, Conference]
---

BSides Hong Kong 2026 wrapped up earlier this year. Two days at the end of June: Day 1 (June 25) was talks at Deloitte in Admiralty, Day 2 (June 26) moved to PwC in Kwun Tong for workshops. This post covers the six Day 1 talks; the two Day 2 workshops (TKO Village and DFIR at Machine Speed) were substantial enough to get their own posts.

Ratings are from a security researcher's perspective and deliberately strict, in half-star steps out of 5. They are one person's opinion — if yours differ, I'm probably the one who's wrong.

## The Talks

### The Quantum-Sized Threat · Philip Mok (Deloitte)

Rating: ★★☆☆☆

An introduction to the quantum threat against RSA and other public-key cryptography, walking from Shor's Algorithm through Harvest Now, Decrypt Later to the NIST FIPS 203/204/205 migration framework. Nothing was wrong, and the speaker's HKMA advisory experience showed, but the key slides failed to render on stage — several diagrams had to be described verbally — and most of the content is already in the NIST documents. For a BSides audience the surprise factor was limited. The POODLE analogy was the one genuinely memorable moment. Positioned as an executive briefing it would work fine; on a technical conference track it struggled.

### Living Off the Control: Defending · Jack Yip (Wizlynx)

Rating: ★★★½☆

My favorite conceptual talk of the day. The core idea is "ownership confusion": every control looks reasonable in isolation and passes review, but chained together they form an unintended privilege escalation path. The case study came from a red team engagement: a low-privilege support account combined a password-reset permission with an existing MFA exception group and ended up holding a cloud session — the whole chain never triggering an MFA prompt. The talk then extended the idea to GitHub Actions OIDC: a workflow's permissions are the sum of what every team along the way approved, and no single team ever reviewed the total. As the speaker put it, ownership is defined by responsibility, but the consequences happen along the connection. What kept it from a higher score: no Sigma rules, no detection queries — defenders have to engineer the detection side from scratch themselves. The concept is one step ahead of the tooling.

### Cybersecurity in Railway Systems · Gary Chu & Julian (Ricardo)

Rating: ★★★☆☆

An OT security overview set in the railway domain, covering OCC, ATO and TCMS before landing on TS 50701 and IEC 62443. To the speakers' credit they were honest about where rail stands: security maturity in the "middle of the pack," vulnerabilities discovered five years ago still unpatched, and asset owners who left the company long ago with no one to hand over to. No novel research, but a solid on-ramp for newcomers — and it planted the flag for the Day 2 TKO Village workshop.

### Sharing is Caring: Type Confusion by Exploiting C++ Shenanigans and Insecure Deserialization · Johnathan Law

Rating: ★★★★½

The highest-rated talk of my Day 1. The opener used an odd-one-out puzzle to get at what type confusion actually is — the same bytes, a different interpretation — and from there the ladder climbed steadily: casting a `std::string` to an int leaks a heap address, then arbitrary read, fake vtable, ROP chain, RCE. The pacing was excellent. The second half was new research: across five C++ libraries that support pointer serialization, manipulating the serialized object ID forces shared-pointer aliasing — direct type confusion — and the same trick against unique pointers yields a double-free. The DEP analogy landed well: back then we couldn't tell data from code, and now we can't tell pointers from data. The HPX patch shipped the day before the talk, so this is research in progress. Nitpicking hard: the memory-write and ROP sections were rushed, and 45 minutes is genuinely tight for basics plus new research. Hoping the recording comes out soon.

### Hacking AI Agents: Skills, Memory, MCP & the New Exploit Surface · Hebe Au

Rating: ★★★★½

Another high-quality session, with the thesis stated up front: prompt engineering is useful, but it is not a security boundary. The demo targeted an AI insurance claims platform and pushed a payout from $3,970 to $95,000 across five attack surfaces: the data channel (indirect prompt injection inside documents), the persistent channel (vector-store memory poisoning that survives across sessions), the detonation channel (chain reactions through the A2A protocol), panel suppression (MCP tool description poisoning — even the OCR tool could be hijacked), and the ecosystem channel (skill files — with a real-world case surfacing the day before the talk). As a bonus, a prompt-cache timing side channel: roughly 81 seconds on a cache hit versus 195 on a miss. The caveats, which the speaker owned: the demo ran on a small local model, and some of the attacks may not hold against frontier models; the defensive recommendations were compressed.

### The Self-Harvesting AI · Jason Mak

Rating: ★★☆☆☆

The speaker is 16 years old and already has vulnerability cases with multiple vendors — standing on a BSides stage at that age is an achievement in itself. On content alone, though, this was indirect prompt injection against the YouTube Studio AI assistant: Base64 payloads, URL fragmentation, and forged system tags, combining known techniques so that the summarizer would decode the payload itself, harvest environment metadata itself, and assemble its own exfiltration link. The concept is interesting but the execution leans on known primitives, and with the test account shadowbanned the demo had to be pre-recorded, which cost it some persuasiveness. With more polish — extending to other platforms, or reaching zero-click — this research would get much stronger. Looking forward to the improved version.

## Verdict

Six talks averaging 3.25/5. Type Confusion and the AI Agents talks are real research that would hold up at international conferences; Quantum and Self-Harvesting feel closer to lightning-talk weight. That's not a knock on the speakers — every talk showed preparation — it's a slot-matching problem between 45-minute main-track sessions and awareness content, and the responsibility sits with the program committee. Splitting "new research" and "introductory awareness" into different session types next year would lift the whole impression considerably.

A side note: Chris Chan's HK threat intelligence pipeline talk (handling DragonForce, Lotus Panda and other locally relevant intel) had no recording and isn't scored here, but the live impression was good — a shame.

## Epilogue

Across one day — quantum, identity, OT, C++ memory safety, AI agents — the talks looked unrelated, but they were all asking the same question: how much utility do old defense concepts have left on new attack surfaces. As an audience member, this was a year I learned things; as a reviewer, the scoring stays strict.

(Scores are one person's opinion — corrections welcome. The two Day 2 workshops have their own posts.)
