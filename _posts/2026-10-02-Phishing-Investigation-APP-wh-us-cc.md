---
layout: post
title: "Phishing Investigation Report: APP-wh.us.cc Fake WhatsApp Security Center"
date: 2026-10-02 12:00:00 +0000
slug: "Phishing-Investigation-APP-wh-us-cc"
tags: [Phishing, OSINT]
---

**Date:** 2026-10-02
**What triggered this:** A scam SMS in Traditional Chinese. It claimed the recipient's WhatsApp broke security rules and had to be "verified" within 12 hours via `https://APP-wh.us.cc`, or the account would be cancelled.
**Verdict:** A live, professionally built WhatsApp account takeover kit. Do not open it on a real phone. If you already did more than glance at it, see section 7.

---

## 1. The short version

This is not a password stealing page. It's an automated system for hijacking WhatsApp accounts through the official "link a device" feature, and it works without ever touching malware.

The flow: the victim types in their phone number, the attacker's server fires off a real WhatsApp device linking request for that number, and the page then shows an 8 character code. The victim is coached to punch that code into a genuine WhatsApp notification on their own phone. The moment they do, the attacker's device is linked and quietly mirrors the whole account.

A few things worth knowing up front:

- The kit is a commercial product. Internally it's called `xinh5`, it's built on a Chinese admin framework called Vben Admin Pro, and the code comments (in Simplified Chinese) casually reference "competitor" kits. Someone sells this.
- It ships with 17 languages and a full worldwide dial code list. The default is Traditional Chinese with a Hong Kong flag, which is how you got targeted.
- **No malware, no APK, no backdoor software.** The whole attack is web based (more in section 6).
- The domain family runs hot: the TLS certificate was issued the same day I looked at it. They rotate infrastructure fast.
- The scam pattern itself is well documented (HKCERT put out an alert in June 2026), but this specific domain family appears in zero public reports, so this SMS is early evidence worth handing to the good guys.

---

## 2. The scam, step by step

![image](https://hackmd.io/_uploads/B1NKe-69Ge.png)

### 2.0 The flow at a glance

Six phases, five actors. The part people find hard to believe is phase 4: the victim performs the takeover on their own phone, inside the genuine WhatsApp app, which is why nothing here is technically "hacking".

| Phase | What happens | Who acts | Where |
|---|---|---|---|
| 1. Delivery | Scam SMS with deadline ("12 hours") and link carrying the affiliate `invite` code | Affiliate SMS blaster | Victim's SMS inbox |
| 2. Landing | Fake Security Center loads, visit counter fires, threat copy shown, language selected | Victim + kit | `APP-wh.us.cc` (or an affiliate front iframing it) |
| 3. Harvest | Phone number entered, `getCode` triggers a real WhatsApp link request for that number | Victim + backend | Kit + Spring Boot API |
| 4. Linking | Page polls until the 8 character code arrives, coaches the victim through typing it into the real WhatsApp notification | Victim + attacker backend | Kit + victim's WhatsApp |
| 5. Takeover | Attacker's device links, task hits state 2, success page tells the victim to keep it | WhatsApp servers | Victim's account |
| 6. Persistence | Linked device mirrors everything; stragglers get "customer service" chat; rate limited numbers get farmed for a second number | Attacker + kit | Victim's account + kefu.werv.me |

```text
Victim (phone)          Affiliate front (CF)      Core kit (app-wh.us.cc)
      |                        |                          |
      |-- taps SMS link (invite code) --------------------->|
      |                        |-- loads core (iframe/redirect) --> kit
      |
      |   kit -> backend: GET /whatsapp/visit          (traffic counter)
      |   [phase 2: threats, language picker, "Start verification"]
      |-- human verification click ----------------------->|
      |-- enters phone number --------------------------->|
      |                        kit -> backend: GET /whatsapp/getCode?phone=+...
      |                        backend -> WhatsApp: REAL "link with phone
      |                                  number" request on the victim's number
      |<-- WhatsApp notification: "Enter code to link a new device"
      |   [kit polls checkCode?uuid=<taskId> every 500 ms]
      |<-- kit shows the 8-char code + 7-step coaching
      |   [phase 4: victim types the code into their own WhatsApp]
      |-- enters the code in WhatsApp ---------------------> WhatsApp
      |                        WhatsApp -> attacker device: LINKED
      |                        backend -> kit: state 2 (done)
      |<-- success page: "do NOT remove Google Chrome (Windows)"
      |
      |   attacker device silently mirrors all messages
      |
      |   if WhatsApp rate-limits the number: red banner,
      |     button becomes "switch to another phone number"
      |   if the victim stalls: live "customer service" chat
```

### Step 1: The landing page

![01_landing_page](https://hackmd.io/_uploads/B1wYaxpczl.png)


A clean, convincing fake "WhatsApp Security Center" (screenshot above, captured in a sandboxed browser at phone size). Threatening copy: "We detected abnormal activity on your account... if you don't verify in time, the system will ban your account."

Two details worth noticing:

- Every visit pings `GET /whatsapp/visit`, a counter on their backend. They track traffic like any business.
- The "Start Verification" button sets a cookie and jumps to the next stage.

### Step 2: The verification SPA

![02_stage2_phone_entry](https://hackmd.io/_uploads/ryV5alpqGl.png)

The next stage is a single page app that describes itself in the HTML as "WhatsApp device linking", which is refreshingly honest for a phishing kit. After a "human verification" click-through (screenshot above), it asks for one thing: your phone number. Country selector covers the entire world.

### Step 3: What actually happens with that number

This is where it gets nasty. From the kit's own code:

1. The page sends `GET /whatsapp/getCode?phone=+XXXXXXXX` to their backend.
2. Their backend initiates a **real WhatsApp "link with phone number" request for the victim's number**. (This is the same thing that happens when someone tries to add a new device to your WhatsApp.)
3. The page polls `GET /whatsapp/checkCode?uuid=<taskId>&sig=<sig>` every 500 ms waiting for the code.
4. When the poll returns state 1, the page shows the attacker's **8 character linking code** (format `[A-Z0-9]{8}`).
5. The page coaches the victim: "If you see a WhatsApp notification saying 'Enter code to link a new device', tap it and enter the code below."
6. The victim types the code into their own WhatsApp. State 2 means done: the attacker's device is linked.

The victim performs the takeover on themselves. That's the entire trick, and it's why there's no malware.

### The psychology is the real weapon

The kit talks people out of the escape hatches WhatsApp built for exactly this:

- It pre-emptively explains away WhatsApp's genuine "this might be a scam" warning, calling it "a standard security notice shown to all users worldwide."
- It tells victims to **remove their currently linked devices first** (so the victim's own computer sessions get evicted and the attacker's session stands alone).
- On the success page: "Do NOT remove the linked device Google Chrome (Windows) to avoid being restricted again." That "device" is the attacker.
- If a number gets rate limited, the page suggests "switching to another phone number," and if someone stalls, a live chat "customer service" agent steps in (more on that below).
- Landing URLs carry an `invite=` code that gets attached to the task, so every victim is attributed to the traffic partner who delivered them. This is an affiliate operation with paid distribution. The code comments even name an affiliate ("阿忠" / A-Zhong).

---

## 3. Traffic analysis

Full breakdown of what the site talks to, reconstructed from the kit's own network layer (every request the page can make is defined in its scripts, which we have in full) plus live probing:

| # | Request | What it does |
|---|---|---|
| 1 | `GET /whatsapp/visit` | Visit counter. Returns `{"code":200,"data":null}` |
| 2 | Kit assets, including a 293 KB app bundle | The SPA itself |
| 3 | `GET /whatsapp/supportUrl` | Returns the live "customer service" chat URL, currently `https://kefu.werv.me/web/visitor.html`. Operator can rotate it server side |
| 4 | `GET /whatsapp/getCode?phone=+<8 to 15 digits>` | Triggers the real WhatsApp link request on the victim's number. Returns a numeric task ID (sequential, so enumerable in principle) |
| 5 | `GET /whatsapp/checkCode?uuid=<taskId>&sig=<sig>` polled every 500 ms | The state machine: 0 waiting, 1 code ready, 2 done (takeover complete), 3 error, 429 "this number is temporarily restricted by WhatsApp", 503 backend busy |
| 6 | `wss://<host>/syncer/whatsapp/ws?sid=<uuid>&invite=<code>` | The original realtime channel. The kit ships a REST polling shim because Cloudflare breaks their WebSocket upgrades. `sid` is a per victim UUID stored in localStorage |

A few extra observations:

- Two backends sit behind the nginx front: a Spring Boot API (`/whatsapp/*`, error messages in Chinese) and a separate Node "syncer" (`/syncer/*`). The Node service's source is referenced in comments as `xinh5/syncer-bridge/server.mjs`.
- The 429 handling is telling: it exists because their volume is high enough that WhatsApp rate limits the numbers they attack.
- **No fingerprinting or anti-bot tech in the client.** No canvas checks, no bot detection. The `sig` parameter is just a continuation token the server hands out. They did add one small guard: nginx returns 403 to the `HeadlessChrome` user agent (I hit it while taking the screenshots for this report). That's an anti-analysis touch, not victim facing protection.
- No admin panel or victim database is exposed publicly. The operator dashboard (the Vben Admin one, build marker dated 2026-08-07) lives somewhere private.

### What gets stored on the victim's browser

`wa-lang`, `wa_locale`, `wa-verify-passed` (session and local storage), a `wa_verify=1` cookie (24 h), `whatsapp_session_id`, and `wa_h5_task_id`. Nothing malicious, just flow state.

---

## 4. Where it lives (IOCs)

**Block and report these:**

| Indicator | Detail |
|---|---|
| `app-wh.us.cc`, `app-ws.us.cc`, `apps-ws.us.cc`, `btn-ws.us.cc` | The four phishing hostnames, all on one IP |
| `45.136.14.5` | That IP. AS139659 LUCIDACLOUD LIMITED, Tung Chung, Hong Kong. Only ports 80 and 443 open. **Not behind Cloudflare**, the DNS record points straight at it |
| `kefu.werv.me` / `werv.me` | The "customer service" chat hub. This one *is* Cloudflare fronted |
| `whantfaspp.us.cc`, `whataapp.us.cc`, `u-xhsap.us.cc` | Burned or sibling affiliate front domains found via urlscan. `u-xhsap.us.cc` was still live at analysis time |

How I can be confident about the IP: DNS for all four phishing names resolves directly to 45.136.14.5, the response headers show a bare `Server: nginx` with no Cloudflare fingerprints (no `cf-ray` header), and the TLS certificate served on that IP lists **all four phishing hostnames in its SAN fields**. One certificate covering all four names means one operator on one box. The cert itself is from Let's Encrypt, issued 2026-10-02 (the day of this analysis), expiring 2026-12-31, thumbprint `66F1F4651BF6C5177FF97B0C43F0CF61F0A3BE6E`.

RDAP registration check (2026-10-02): the covering netblock is `45.136.12.0 - 45.136.15.255`, netname **HK-XNNET**, allocated 2019-07-31 via APNIC, registrant ORG-XL117-RIPE, maintainers XNNET-MNT / XNHK-RIPE, and the registered abuse contact handle is **XNHK-RIPE** (reachable via APNIC's abuse-finder, search "XNHK-RIPE abuse"). That contact plus LUCIDACLOUD's own abuse desk are the two takedown doors for the origin box.

Nameservers: `ns1/ns2.domainnamens.com`. The hostnames live under `us.cc`, a free subdomain registry the operator abuses for throwaway names.

---

## 5. Other victims: yes

The exact play (fake Security Center, phone number, "link device by phone number", 8 character code, hijack) is publicly documented:

- [HKCERT phishing alert, 2026-06-12](https://www.hkcert.org/tc/security-bulletin/phishing-alert-beware-of-fraudulent-whatsapp-security-centre-pages-hijacking-accounts_20260612)
- [Hong Kong Anti-Deception Coordination Centre alert](https://www.adcc.gov.hk/zh-hk/alerts-detail/alerts-1747588349911461890.html)
- [HK01 reporting roughly 50 hijack cases a week and about HK$20M in weekly losses, with one victim losing HK$15M](https://www.hk01.com/%E7%AA%81%E7%99%BC/60395468/), plus [dotdotnews coverage](https://www.dotdotnews.com/a/202609/30/AP6abcdbc9e4b02724bdb60805.html)
- Matching warnings from [Singapore Police (March 2026)](https://www.police.gov.sg/Media-Hub/News/2026/03/20260312_police_advisory_involving_the_compromise_of_whatsapp_accounts), [Malaysia's MCMC](https://www.facebook.com/TheStarOnline/posts/mcmc-said-it-is-looking-into-public-concerns-over-complaints-related-to-whatsapp/1576227054539814), and [Taiwan's fact check centre](https://tfc-taiwan.org.tw/fact-check-reports/whatsapp-account-verification-scam-alert)

What's interesting is what is *not* there: zero urlscan submissions and zero web reports mentioning this domain family or `werv.me`. This deployment is brand new and privately distributed. You're among its first recipients, which makes your SMS genuinely useful as evidence for a takedown.

### 5.1 Threat intel sweep (2026-10-02)

I ran the indicators through every threat intel source that works without a paid key, and the result is a clean sweep of "nobody has seen this yet":

| Source | Result |
|---|---|
| VirusTotal | Queried with an API key (all nine objects): **zero detections anywhere**. The four phishing domains, the IP, and `kefu.werv.me` all score 0 malicious across 91 engines, and the URL object for `https://APP-wh.us.cc` doesn't even exist in VT, nobody has ever submitted it. What VT *did* give up is passive DNS history, see 5.3 |
| urlscan.io | 0 scans of 45.136.14.5 in the anonymous 30 day window. Only the burned affiliate fronts (whantfaspp, whataapp) had ever been scanned |
| URLvoid (30+ engine aggregator) | Never submitted, no report exists |
| Spamhaus DBL (domain) and ZEN/SBL (IP) | Not listed (NXDOMAIN on both) |
| ThreatFox / URLhaus (abuse.ch) | APIs now require keys, couldn't check |
| AlienVault OTX | Page is JavaScript gated, no data extractable |
| Reverse DNS on the IP | No other hosted domains |

The ecosystem wide blindness is itself a finding: this deployment was rotated before any blocklist caught up. Which also means a report from you right now (VT submission, HKCERT, Let's Encrypt abuse) has outsized impact, you'd be the first.

### 5.2 The timeline the certificates tell

Certificate transparency logs (via Cert Spotter) nail down the operator's schedule surprisingly well:

| When (UTC) | What happened |
|---|---|
| 2026-08-07 | Kit build marker ("Date Created") inside the Vben Admin bundle |
| 2026-08-19, 06:09 and again 06:15 | Two `*.werv.me` wildcard certs issued six minutes apart, the "customer service" hub is being stood up |
| 2026-08-23 | Third `*.werv.me` cert, still iterating |
| 2026-09-26 | Landing page and bundle last modified on the server |
| 2026-09-26 to 09-30 | urlscan scans hit the first affiliate fronts (whataapp, whantfaspp), which then burn out and die |
| **2026-10-01, 23:18** | **First certificate ever issued for app-wh / app-ws / apps-ws / btn-ws.us.cc.** One cert, four names, one operator |
| 2026-10-02, ~07:28 | Your SMS gets investigated. The phishing core was roughly **8 hours old** at that moment |

So: six weeks of infrastructure prep starting mid-August, burned fronts in late September, and the current domain family activated the night before the SMS wave. Textbook rotation.

### 5.3 What VirusTotal's passive DNS revealed: six years of history on that IP

The one place the campaign left a trail is the IP. VT's resolution history for `45.136.14.5` lists **25 distinct hostnames** over the years, and they read like one operator's personal VPS that later got repurposed:

| Period | Domains on 45.136.14.5 | What they look like |
|---|---|---|
| Oct 2019 | `119hx.cn` | old Chinese site |
| Jun 2022 | `www.7fk.pw`, `www.99ab.me` | short-lived sites |
| Jul to Sep 2024 | `ai-chatgpt.eu.org`, `chat-api.cn`, `gptoai.cc`, `share.swt-ai.com`, `abc.transapi.cn`, `it-tools.tiegangan.top`, `369447.xyz`, `369347.xyz`, `uptime.369447.xyz`, `611612.xyz`, `www.smnet.asia`, `cdn.smnet.asia`, `cdn.mitsumune.tk`, `kkpy.eu.org`, `itvps.eu.org`, `wmymz.pp.ua`, `v.wang.f5.si` | a cluster of Chinese AI/ChatGPT tools, translation and chat APIs, an IT-tools web app, an uptime monitor, CDN and shortlink fronts. Free TLDs (eu.org, pp.ua, tk, f5.si) mixed with cheap .cn/.cc/.xyz registrations: a hobbyist-to-graymarket developer stack |
| Nov 2025 | `net.gxlib.cn` | quiet period, single site |
| **Oct 2026** | `app-wh.us.cc`, `app-ws.us.cc`, `apps-ws.us.cc`, `btn-ws.us.cc` | **the WhatsApp phishing family** |

Read together: the same Hong Kong box spent 2024 hosting a Chinese developer's AI tooling projects, sat mostly quiet through 2025, and became the origin for a commercial WhatsApp account takeover kit in late 2026. The 2024 cluster is a useful attribution lead (someone who ran `chat-api.cn` and `ai-chatgpt.eu.org`), and it means the "new" infrastructure isn't new at all, only the domain family is. The box has history, which is exactly the kind of thing law enforcement can act on.

One more VT detail worth knowing: `werv.me` itself has been scanned by all 91 engines, 55 call it harmless, the rest undetected, zero malicious. Every indicator in this campaign is clean on every engine as of 2026-10-02. Submitting the URL and the four domains to VT (free to do from their site) would make you the first reporter and would start protecting other potential victims immediately.

---

## 6. Backdoor verdict: no software, yes persistence

**No software backdoor.** I went through the entire 293 KB bundle and all eight support scripts looking for APK downloads, `intent://` or `whatsapp://` deeplinks, drive-by download logic, and exploit code. Zero hits. Nothing installs on your phone, and the only thing the site ever collects is your phone number.

**The functional equivalent of a backdoor is the linked device itself.** Once linked, the attacker's session (it shows up as "Google Chrome (Windows)") mirrors every message for as long as it sits in the Linked Devices list, and the kit actively persuades victims to keep it there and remove their own devices instead. As long as that entry exists, the attacker has ongoing access. Removing it and switching on two step verification closes the door for good.

One footnote from a closer look at their backend: task status can be polled without the signature parameter, and task IDs are plain sequential numbers. I tested a small sample of IDs and they all came back empty (tasks appear to be short lived or the ID range isn't where you'd guess), so it's not a practical "backdoor into the scam." It's a weakness in their setup that researchers or police could use to size the operation after a seizure. I stopped at six probes deliberately: anything more starts to look like unauthorized access to their systems, which is a legal problem even when the target is criminal.

---

## 7. What to do now

**If you only received the SMS:** nothing to clean up. Report and delete.

- Report to HKCERT (hkcert@hkcert.org, +852 8105 6060). Include the full SMS and the sender number. This domain is unreported and fresh, so a takedown is realistic.
- Report to Meta (phish@meta.com, and in-app report for the message).

**If you (or a family member) entered a phone number AND typed an 8 character code into WhatsApp:**

1. WhatsApp > Settings > **Linked devices** > remove anything you don't recognize, especially anything called "Google Chrome (Windows)".
2. Turn on **two step verification** immediately. It blocks future linking attempts.
3. Warn your contacts, scam messages may have gone out from the account.
4. If banking or 2FA messages flow through that WhatsApp, tell the bank.

**For defenders:** alert on any `*.us.cc` or `werv.me` DNS lookups, on the paths `/whatsapp/getCode`, `/whatsapp/checkCode`, `/whatsapp/visit` and `/whatsapp/supportUrl`, and block 45.136.14.5.

---

## 8. Evidence and method

Method notes, so nobody has to trust me blindly: every claim above comes from either the kit's own source (downloaded in full), read-only GET probes against the live backend, DNS and certificate inspection, or public OSINT. The dangerous endpoint `/whatsapp/getCode` was **never** called with a phone number, because that would have triggered a real WhatsApp link attempt against someone. Traffic behavior was derived from the kit's network layer, which defines every request the page can make; for an all-HTTPS site that's equivalent to reading a MITM capture. Screenshots were taken with a headless browser using a normal mobile user agent after the site's nginx returned 403 to the stock headless identifier.

---

## 9. Appendix: script by script, what the kit actually does

The kit is twelve files, and each one tells you something. The version strings on the files (`?v=2` up to `?v=10`) and the changelog style comments ("the previous version hooked X, it failed on mobile WebKit, so now...") show an actively maintained product with a fix history, not a one-off throwaway.

### The pages

**`index.html` and `verify.html`** are the same landing page twice. Threat text in eight built-in translations (the full 17 language list lives in `i18n.js`), a `/whatsapp/visit` counter ping on every load, and a verify button that sets three flags (session storage, local storage, a 24 h `wa_verify` cookie) before jumping to `/index.html?ok=1`.

**`wa-h5-entry-gate.js`** is the bouncer: if you land on `/index.html` without `?ok=1`, the cookie, or a storage flag, you get bounced back to `/verify.html`. Its comment name drops another internal project, "wsapp-hub", so the operator has a naming system for the parts.

### The code grabbing machinery

**`wa-rest-ws-shim.js`** is the heart. The original design used a WebSocket at `/syncer/whatsapp/ws`; the comment says they moved to same-origin REST polling because Cloudflare breaks the WebSocket upgrades on their deployment paths. This file patches `window.WebSocket` so the app above it still "speaks WebSocket" while the shim actually does `getCode` and 500 ms `checkCode` polling. Phone validation is 8 to 15 digits with a `+` prefix, that's all it ever collects.

**`wa-retry-fix.js`** is the most revealing file in the kit:

- It intercepts error events (`task_failed`, `unavailable`, `busy`) and **rewrites them to "waiting"** before the UI sees them, so the victim never learns anything failed. Then it silently re-sends the link command (max one auto retry, 2.5 s spacing).
- On a `cooldown` (WhatsApp has rate limited the number being attacked), it pops a red "number temporarily restricted" banner and **replaces the main button with "switch to a different phone number"** (更换其他手机号码), clears the input and focuses it. When WhatsApp starts blocking one number, the kit farms a second one from the same victim.
- It scrapes the phone number straight out of the page DOM on every "Continue" click and remembers it even if the UI resets.
- Another comment mentions "the Hong Kong / Cloudflare line" (香港/CF 线), confirming deployment paths that run through Cloudflare fronted promo domains.

![image](https://hackmd.io/_uploads/rym5AlaqGg.png)


**`wa-deeplink.js`** watches the code display four times a second. When the 8 character code lands it coaches the victim to tap the real WhatsApp notification ("Enter code to link a new device") and type it, with localized nudges for zh-CN, zh-TW and English. It even auto-dismisses any "connection unavailable" dialog that pops up: the kit fights the real app's warnings from inside the browser.

**`wa-success-page.js`** fires when the task hits state 2. Three things stand out:

1. It hooks `WebSocket.prototype.onmessage`, wraps `addEventListener`, patches the constructor and runs a 400 ms DOM watcher: four redundant paths so the "done" moment is never missed on any phone browser. The comment explains the previous version failed on mobile WebKit. That's real engineering effort spent on scam reliability.
2. It polls `checkCode` **without the sig parameter** every 1.5 s for up to 10 minutes, surviving the victim closing the main flow. This is the unauthenticated read mentioned in section 6.
3. The success card itself is hardcoded Simplified Chinese no matter the victim's language ("验证成功！你已完成安全关联！请勿移除安全关联 Google Chrome（Windows）以免再次被限制！"), which is both an operational slip and a nice attribution detail.

It also has a `?previewSuccess` URL parameter for the operator to preview the success screen, which is how I captured this without victimizing anyone:

![04_success_page](https://hackmd.io/_uploads/HyQ3pgacGl.png)

And it posts a `wa-login-success` message to its parent frame when embedded in an iframe, which brings us to:

### The affiliate plumbing

**`wa-customer-service.js`** adds the floating support button and an inline "if automatic verification fails, contact online support" tip. The file contains the single clearest piece of evidence for the affiliate architecture, a developer comment explaining why its API fetch must send cookies:

```js
// 必须 same-origin：阿忠那些推广域名走 Cloudflare，omit 会丢掉 cf_clearance，
// 接口被挑战页拦住后这里只能落到管理员默认客服。
```
![image](https://hackmd.io/_uploads/HkuiTx6qzx.png)


Translation: "Must be same-origin: A-Zhong's promo domains go through Cloudflare; using `omit` loses the `cf_clearance` cookie, and once the API gets blocked by the challenge page, [the victim] would only fall through to the admin's default customer service." In other words: the Cloudflare-fronted promo domains embed this core in an iframe, the Cloudflare clearance cookie has to ride along on API calls or the challenge page eats them, and each affiliate gets its own support chat room. It also matches the measured reality (the fronts are CF-fronted, the core is not). One caveat: "阿忠" (A-Zhong) is the kit author's casual nickname for that affiliate partner, a lead, not a verified identity.

**`_app.config.js`** freezes one config value, the default support URL (`kefu.werv.me`), and its variable name (`_VBEN_ADMIN_PRO_APP_CONF_`) is what fingerprinted the underlying framework, Vben Admin Pro.

### Inside the affiliate chat: the IMKEFU protocol

The sibling affiliate front (`u-xhsap.us.cc`) runs its own chat widget, and its bundle reveals the machine protocol hiding inside the "customer service" conversations. It's a Chatwoot-style widget (API `/api/v1/widget/...` with `website_token=6dJepPqUrGjFEyghb3G53a6m`) skinned as WhatsApp support, and the backend embeds invisible, typed markers inside ordinary chat messages:

- `[[IMKEFU_PHONE:<base64>]]` renders the phone collection card ("please enter the phone number registered with WhatsApp", country selector from a live config listing ~230 countries, defaulting to CN, HK, MO, TW in that order)
- `[[IMKEFU_CODE:<base64>]]` renders a dedicated "verification code card", the 8 character code delivered straight into the chat, with a "re-obtain verification code" (重新获取验证码) quick button for round two
- `[[IMKEFU_NOTICE:<base64>]]` renders fake "security notice" cards
- `[[IMKEFU_HANDOFF]]` is the control signal: when it arrives, the widget flips `humanMode` on and the victim is told a "human security specialist" (人工安全专员) is now connected

A sanitizer strips every `[[IMKEFU_...]]` marker before rendering, so victims only ever see clean "official" cards, never the plumbing. The conversation opens with a zero-width space message (an invisible ping that starts the bot session), and the whole widget sits behind a "security verification" gate stored as `imkefu-security-verified:v1` in localStorage.

Two operational details worth flagging:

1. **It's bot first, human second.** The automated bot walks victims through phone entry and code delivery, and only when that fails does `[[IMKEFU_HANDOFF]]` bring in a live scammer playing a "security specialist". That's how a small crew handles many victims at once.
2. **There's a QR variant.** The widget contains a "PC scan-code link" (电脑扫码链接) mode that shows victims a QR code to scan, the WhatsApp Web linking flow, as an alternative takeover channel to the 8 character code.

The chat's public config endpoint was still live at analysis time and leaks its asset host, `imm.xilaile.cc` (Cloudflare fronted), serving the fake WhatsApp logo: another domain for the takedown list.


### The polish layer

**`wa-steps-fix.js`** is a CSS patch that hides the seventh instruction step when it's empty (only Chinese gets seven steps).
**`wa-overlay-fix.js`** force-hides a "checking your WhatsApp account" overlay if its fake progress bar sticks at 100%, with a comment about not fighting Vue over the DOM.

### The instructions inside the bundle

The 293 KB minified bundle holds the actual victim walkthrough, localized for every supported language. The English version:

1. "Open WhatsApp on your phone"
2. "On Android, tap Menu; on iPhone, tap Settings"
3. "Tap Linked Devices, then Link a Device"
4. "Tap Link with phone number instead, then enter this verification code on your phone"
5. "Enter or paste the eight-character verification code"
6. "Do not leave or cancel account linking during the check; otherwise, your account may be deactivated"

Step 4 is the exact wording of the genuine WhatsApp option, and step 6 is a threat designed to stop the victim from aborting halfway. The Chinese variant adds a seventh step with the same "don't exit or your account will be deregistered" threat. The bundle also contains the anti-scam-warning counter-scripting (section 2), the instruction to remove already linked devices, the full worldwide dial code table, and the affiliate `invite` code handling. No APKs, no exploits, no fingerprinting anywhere in it: the bundle is a well built UI for one purpose, getting that code typed in.
