---
title: "TKO Village PLC Workshop Review"
date: 2026-09-30 12:00:00 +0000
slug: "TKO-Village-PLC-Workshop-Review"
tags: [BSides HK, OT]
---

Following the Day 1 talk reviews: for the BSidesHK Day 2 morning session (June 26, PwC in Kwun Tong) I attended the TKO Village workshop run by Ricardo's Gary Chu and Julian. The star of the show is a miniature city built from Lego, wired to real PLCs behind it. IT people always say they want to learn OT but never have the environment — this workshop exists to fill exactly that hole.

## About the village

The lab is a labor of love funded out of the speakers' own pockets. The Lego is off-brand from Taobao — the speakers themselves call it fake Lego (when he tried to sell his 50 boxes, the buyer's first question was whether it was genuine). The most expensive component turned out to be the PLC: a brand-new Schneider unit bought from Taobao cost two to three thousand HKD (second-hand ones trade at whatever people ask), which alone was about 80% of the total spend — and he had to run it by his wife before placing the order. The star of the show, the M221, was a birthday gift from an old friend who works at Schneider — the speaker had originally asked for a pair of socks for Christmas. The control core is two Raspberry Pi B+ boards (one didn't have enough GPIO, hence two).

The front end is the Lego city: traffic lights, street lamps, transmission towers, a 7-Eleven, a McDonald's, a Japanese restaurant. The back end is the RPis, power supplies and an unmanaged switch, all on one network — deliberately unsegmented, faithfully reproducing an unhardened flat OT network. The speakers said a lab like this is hard to find in Hong Kong, or anywhere in Asia, and the single purpose of running the workshop is to get more IT people interested in OT.

![The village front end: the Lego mini city — traffic lights, transmission tower, 7-Eleven and McDonald's are all controllable outputs]({{ site.baseurl }}/assets/images/bsideshk-tko-plc/IMG_8527.jpeg)

![Close-up of the village: lighting and buildings in each district]({{ site.baseurl }}/assets/images/bsideshk-tko-plc/IMG_8530.jpeg)

## How the workshop ran

Nominally three hours, roughly like this:

1. **Opening + Day 1 recap** — why IT people need to understand OT, and how many of the audience had attended the Day 1 railway talk;
2. **OT 101** — IT vs OT, ICS components (PLC, sensor, HMI), SCADA vs DCS (the beer-bottling-plant example), and the role of SIS;
3. **Threats and incidents** — the Stuxnet kill chain, BlackEnergy, an industry incident timeline (Ukraine power grid, Colonial Pipeline, Oldsmar water plant, Michigan traffic lights — see the slides);
4. **OT assessment in practice** — pentest vs VA, the real-world limits of port scanning, the patching dilemma;
5. **Break**;
6. **Village tour** — the self-funded lab story (fake Lego, the birthday-gift M221), hardware and wiring, the OpenPLC software architecture;
7. **Live attack demo** — nmap port scan, `mbtget` reading coils, writing coils to force every light in the city red, simulating an accident;
8. **RunZero asset discovery demo** + market news from OT security;
9. **Quiz with prizes** (Cyber Ninja Lego);
10. **Close** — an open invitation to connect on LinkedIn.

## Part 1 — OT foundations (the lecture)

The first hour or so built a shared vocabulary between IT and OT. The notes worth keeping:

- **CIA vs S-CIA**: in IT, Confidentiality comes first; in OT, Safety does. "If the train needs to stop, it stops — confidentiality is not the point."
- **SCADA vs DCS**: SCADA is remote and geographically distributed assets (pipelines, power grids); DCS is a single facility. The easiest example to remember is the beer bottling plant: a sensor detects the bottle → the PLC controls filling → capping → data lands in the Historian.
- **SIS is the police of the OT network**: independent of the main control system, it watches critical parameters constantly (say, 210V ±5) and cuts power the moment a threshold is crossed — protecting equipment and people.
- **The Stuxnet kill chain**: drop USB sticks around the plant → infect the engineering workstation → upload malware to the PLC controlling the centrifuges → feed operators normal readings while destroying the equipment.

After that came the Purdue Model, greenfield vs brownfield segmentation strategy, and the practical limits of OT testing. The line that stuck hardest: in OT, when we say pentest, what we actually do is mostly VA (vulnerability assessment) — "because when I ping it, it stops." The plant has to keep running; I ping the PLC and the production line stops. An OT maintenance window might be two or three hours after the last car leaves, so black-box testing is fantasy: either white/grey box to cut discovery time, or passive collection. The room scanned all 65,535 TCP ports, and the speaker asked whether that would fly in the real world — of course not; you scan known protocol ports (502, 20000, 44818) or run passive asset discovery.

The patch-management segment was equally grounded: engineers are afraid to patch ("patch it and who knows what breaks"), the business manager asks why it isn't patched, and the ending is usually risk acceptance. The speakers' view is that the security team's job is to help design compensating controls — segmentation, firewalls — rather than joining the business side in applying pressure.

## Part 2 — the village tour

The second half was the hardware tour, and the details were lovingly done: every LED has a current-limiting resistor (traffic lights 220Ω, street lamps 100Ω); the lanterns at the Japanese restaurant are deliberately wired in parallel rather than series — if one dies, the other stays lit. Even the wire colors follow a convention: orange for outdoors, purple for the Japanese district, red/yellow/green for traffic lights, black for ground, white for street lamps, blue for pedestrian signals. The circuits were designed in the free Tinkercad. On the software side it runs OpenPLC, with registers like `%QX0.0` mapped directly onto GPIO pins.

![The village back end: two Raspberry Pis, the Schneider M221 and an unmanaged switch]({{ site.baseurl }}/assets/images/bsideshk-tko-plc/IMG_8533.jpeg)

## Live demo

The finale was a live attack demo, launched from a Kali box (.241):

1. A ping sweep confirmed both PLCs online (.179 running the towers and shops, .247 the traffic lights and street lamps);
2. Nmap found five open ports: 502 (Modbus TCP), 8080 (OpenPLC web), 8888 (pigpiod), 20000 (DNP3), 44818 (EtherNet/IP). All three OT protocols with zero authentication — Modbus is a 1979 design, and in four decades its security mechanisms have amounted to nothing;
3. Using `mbtget` to read coils showed cycles like 1,0,0,1 — that's the traffic lights stepping;
4. Writing coils directly forced every light in the city red, simulating an accident ("Everything is red. And we can simulate the accident.").

The speaker also explained the pain of black-box testing in OT: with no register map, all you can do is poll every few seconds and match coil values against the physical lights by eye. As a bonus: the OpenPLC web interface's default credentials are `openplc/openplc`, and the reload-program endpoint has a SQL injection — those are left for readers to explore.

![Live demo: nmap showing five open ports]({{ site.baseurl }}/assets/images/bsideshk-tko-plc/IMG_8539.jpeg)

After that came a RunZero asset discovery demo — it finds PLCs on the network, labels the logic they run, and draws a timeline of register values (along the way: RunZero was recently acquired by Accenture together with NetRise and Dragos stakes, a deal quoted at around four billion USD). More market news as a side note: Nozomi acquired by Mitsubishi Electric, Armis acquired by ServiceNow — OT security is moving from niche specialty to mainstream.

## The quiz

The session closed with a quiz, Lego (Cyber Ninja series) as prizes. The questions covered OT integration practice, the communication gap between security teams and plant engineers ("one speaks French, the other Japanese" — the fix is cross-training plus regulations as the shared language), and the NIST CSF / IEC 62443 / TS 50701 frameworks. This part felt the closest to what a workshop's interactivity should be.

## What I took away

From one IT security person's perspective, three hours of takeaways:

- **Mindset shift**: OT's first priorities are safety and availability, not confidentiality. Before any OT assessment action, ask "will this stop the production line" — the exact opposite of IT assumptions.
- **The concept map**: the roles of PLC / sensor / HMI / Historian; SCADA (remote, distributed) vs DCS (single facility) vs SIS (an independent safety layer that cuts power the moment 210V ±5 is exceeded).
- **The reality of OT protocols**: Modbus (1979), DNP3, EtherNet/IP — all with zero authentication. Not "they have vulnerabilities"; security simply was never part of the design. Seeing 502/20000/44818 open in nmap is seeing an unlocked door.
- **Hands-on Modbus**: reading and writing coils with `mbtget`; with no register map you match coil values to physical outputs by eye — black-box testing costs far more in OT than in IT.
- **How cheap a lab like this is**: two RPis + OpenPLC + off-brand Lego gets you an attackable mini city; `%QX0.0` registers map straight onto GPIO, and that's how ladder logic / structured text gets learned.
- **OT assessment methodology**: what gets called pentest in OT is mostly VA; scan only known protocol ports or use passive asset discovery (RunZero and friends); when patching is impossible, design compensating controls (segmentation, firewalls).
- **Found by poking at it**: OpenPLC's default credentials `openplc/openplc`, the SQL injection in the reload-program endpoint, and pulling `.st` source through the web interface — the interfaces a lab exposes to you are themselves attack surface.
- **Market sense**: the OT security M&A wave (Nozomi→Mitsubishi, Armis→ServiceNow, runZero/NetRise/Dragos→Accenture) — this niche is mainstreaming fast.

## Verdict

Rating: ★★★☆☆

Scoring strictly: nominally a three-hour workshop, but in practice about 90 minutes of lecture plus demo, with essentially no audience hands-on — strictly speaking a talk, not a workshop, and one star comes off for that. But as OT onboarding and outreach, the sincerity is beyond reproach: the lab is self-funded, the teaching is heartfelt, and Hong Kong genuinely has no second environment like it to play with. If next year adds real audience hands-on — even just letting participants take turns scanning the network or writing a single coil — the value of this workshop changes completely.

## Epilogue

The speakers kept the closing simple: glad to connect with everyone; anyone wanting to walk the OT security path or learn more is welcome on LinkedIn — "It was a pleasure to be here."

A speaker who funds his own lab just to get more people interested in OT — that enthusiasm for the field is more persuasive than any slide deck.

---

*Note: the workshop's lab documentation is open source on GitHub (the ics-security repo) — if you want to build a similar environment yourself, the bill of materials and register map are both there.*
