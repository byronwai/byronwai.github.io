---
title: "DFIR at Machine Speed Workshop Review"
date: 2026-09-30 12:00:00 +0000
slug: "DFIR-at-Machine-Speed-Workshop-Review"
tags: [BSides HK, DFIR]
---

The Day 2 afternoon session (June 26) at PwC in Kwun Tong: Albert Hui's (Security Ronin) DFIR workshop. The star of the show is Issen, an open-source forensic engine his team built in Rust — their own practice tool, open source on GitHub (SecurityRonin/issen). Three hours from the pain points of existing tools to the vision of five-source correlation, with a genuinely exciting live demo in the middle.

## How the workshop ran

1. **Opening: the pain of existing tools** — a short history of DFIR tooling: generations replacing each other (FTK's version discontinuities, the Eric Zimmerman toolchain era), so the point is not to learn a tool but to learn a framework — read it like a military manual. The speaker said outright he would start from 101 while keeping both experts and newcomers from pentest / IT audit on board;
2. **Why Rust** — memory safety: buffer overflows and heap-spray-style attack surfaces are blocked at the language level (his caveat: not invincible, but the bar is much higher);
3. **Design vision** — the traditional workflow splices output from Autopsy, Volatility and grep by hand; Issen wants one repeatable, auditable workflow;
4. **Scenario backdrop** — a typical intrusion as the backbone: RDP brute force → remote control agent → lateral movement → staging and exfiltration, with a public test image as the evidence source;
5. **Architecture tour** — NTFS as the spine ($MFT, $USN Journal, $LogFile), Windows Event Log layered on top, then SRUM, Memory (Volatility plugin) and Registry; at the top an orchestration layer merges every timeline into one super timeline and runs correlation, with 40+ libraries underneath;
6. **Timestomping detection** — user-modifiable versus system-capped timestamps are compared automatically and flagged when they disagree; in the test image, a file deleted to the recycle bin with a rewritten timestamp got flagged live;
7. **Live demo hiccup** — it opened with "no space left on device," and the speaker debugged while explaining the build requirements: 300 GB to compile, plus the mess of MSI and EXE packaging. Rough edges, handled with composure;
8. **Download break** — everyone was told to download and play on the spot: run `issen report`, get SRUM-format text output, read the analysis results directly;
9. **Findings and output** — timeline findings, timezone findings (a single finding false-positives easily; correlation's co-occurrence is what cuts the noise);
10. **Q&A** — the most memorable question of the session: can you quantify the findings so they're directly queryable — "can you make it more quantified in a way that I could use a SQL query?"

## Technical highlights

- **Five-source correlation**: Disk ($MFT, $LogFile, $USN), Memory, Logs, SRUM, and Content-Addressed Provenance. Today three sources are implemented (disk, memory, logs — SRUM folded into the disk line); the speaker was upfront that live query (using a git commit hash as an addressable key) and content-addressed provenance are not built yet. The vision is five pillars; today there are three.
- **SRUM was the single most valuable takeaway of the session**: Windows' built-in resource-usage database records each application's network bytes and which window was in the foreground — meaning it can answer the question "who was sitting at the keyboard." Even if the event log is wiped, these records survive, which makes them excellent remedial evidence; the speaker's lament is that mainstream tools have never given SRUM its due.
- **Timestomping detection**: automatic comparison of $STANDARD_INFORMATION (user-settable) against $FILE_NAME (system-maintained) — something every forensic tool should have, and almost none do.
- **The Volatility 2→3 gap**: a large number of plugins never migrated; Issen re-implemented the most-used ones itself, covering even some features Volatility 3 is missing.
- **Cross-platform super timeline**: merging NTFS, APFS, ext and other filesystem timelines into one unified view — ambitious; only part of it was demoed live.
- **One CLI end to end**: `issen report` plus correlation in a single command, every event labeled with its source — replacing the manual splice of three or four tools' output.

## Verdict

Rating: ★★★★☆

The most practical session of the eight across both days. The speaker identified a real pain point — fragmented forensic tooling, workflows with no repeatability or auditability — and then actually went and built an open-source tool for it. That execution alone is worth the ticket. The SRUM material and the timestomping detection are the kind of thing anyone who has done IR instantly asks "why don't mainstream tools have this yet?"

What kept it from 5: first, the live demo did have rough patches — the audience spent a while watching build issues get debugged (300 GB, no space left, MSI/EXE), and that is workshop time; second, two of the five pillars are admittedly unbuilt, so vision and shipping product are some distance apart; third, SRUM forensics is not new — Yogesh Khatri has covered it in depth since 2018, and while "mainstream tools ignore it" is true, it isn't unresearched; fourth, the cross-platform timeline was described but only partially demoed. Still, the tool fills a real gap, and with Rust-native engineering quality and the open-source posture, 4/5 is an honest high score. To try it yourself: search SecurityRonin/issen on GitHub.

## Epilogue

The subtext of the whole workshop was the speaker's opening line: tools come and go; what survives is the framework. DFIR needs the repeatability and auditability of traditional forensic science — that's a maturity problem for the whole field, more than for any single tool.

---

*Note: Issen is open source on GitHub (the SecurityRonin org, along with companion libraries like disk-forensic and ntfs-forensic) — the materials to try it yourself are ready and waiting.*
