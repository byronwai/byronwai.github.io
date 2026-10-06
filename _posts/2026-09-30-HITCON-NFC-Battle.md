---
title: "Hacking the HITCON NFC Battle"
date: 2026-09-30 12:00:00 +0000
slug: "HITCON-NFC-Battle"
tags: [HITCON, NFC]
---

> A deep-dive review of [justinlin099/HITCON-NFC-Battle](https://github.com/justinlin099/HITCON-NFC-Battle) (GPL-3.0), assembled from the public source code, a teardown of the distributed XAPK (`org.hitcon.nfcbattle` v0.5.1), and the organizers' own post-event confessions.
>
> Spoiler for the impatient: the best hack in this game was confirmed by its own organizer, involves a rubber duck, and is fully reproducible with one `curl`.

---

## 1. What is it?

HITCON NFC Battle is the official crowd-interaction game for **HITCON 2026** (Taipei, August 21–22, 2026). It combines a physical NFC gimmick — an NTAG sticker on every attendee's badge — with a cross-platform **Flutter** mobile app. Think *Pokémon-meets-business-cards*: tap strangers' badges to collect their pixel-art cards, farm stamps at sponsor booths, climb a live scoreboard, and design a card face that gets **printed onto a real PVC card** at the souvenir booth.

The whole thing is open source: the app, the backend API spec (`Backend/openapi.yaml` + `game-flow.md`), the tag-writing tooling, and the card-printing station software.

| Fact | Detail |
|---|---|
| Package | `org.hitcon.nfcbattle`, v0.5.1 (build 6) |
| Tech | Flutter, ML Kit barcode scanning, Unifont pixel typography |
| Permissions | NFC, INTERNET, CAMERA, network state, Play licensing |
| API | Production via remote config under `hitcon2026.online` (staging default `nfc-battle-staging.hitcon2026.online`) |
| Deep link | `https://game.hitcon2026.online/b?u=<user_id>` (App Links / Universal Links) |
| Sponsor | Panasonic (logo flags in app + print artwork) |

**Where the idea came from — and the confession.** In his post-event note on Threads, Denny Huang ([@denny0223](https://www.threads.com/@denny0223/post/DcYUOclj-gx)), one of the NFC Battle crew, says the game was born after he and Justin (@justinlin099) watched NFC games thriving at 39C3 in Germany — Justin couldn't let it go until HITCON had one. And then, the money quote: avatars are *theoretically* 48×48, but everyone who scanned Denny saw a finely-detailed hacker hat and a yellow rubber duck — because "the source is public, the server also accepts higher resolutions... I basically just talked and didn't do anything special." Keep that in mind for §5.2. His other confession: his leaderboard rank came from being a self-described "social terrorist" who scanned the entire ice-cream queue.

## 2. How the game is played

1. **Install & sign in.** Conference SSO/KKTIX issues you an HS256 JWT with a role claim (`ATTENDEE`, `STAFF`, `SPONSOR`, `COMMUNITY`). First `GET /users/me` lazily creates your profile and hands the app a secret `nfc_tag_key`.
2. **Bind your badge tag.** Self-service pairing is one-time only: the app writes an NDEF record with `https://game.hitcon2026.online/b?u=<your_id>` plus an Android Application Record, then **password-locks the tag read-only** via NTAG `PWD_AUTH` (4-byte password + 2-byte PACK — that's the 6-byte `nfc_tag_key`, stored but never displayed).
3. **Exchange cards — physically.** Tap your phone on someone's badge. The app reads the tag's physical UID *and* the URL, and calls `POST /collection/scan`. The server verifies the UID actually maps to that user — a copied link or forged URL counts for nothing. Success: the target lands in your collection, your `collection_version` bumps, and you see their full profile.
4. **Watch out for phishing.** If the app opens from a *link click* instead of a physical tap, it reports `POST /collection/phishing` (attacker = the user id in the link, victim = the opener) and the **victim is docked points**. The organizers' slogan: "actually tap it in person". Score: `score = 10 × collections − 10 × phishing`.
5. **Farm sponsor stamps.** Scanning a booth's NTAG (or by default a staff badge sticker) earns stamps; **≥ 20 stamps** unlocks the stamp prize.
6. **Climb the leaderboard.** Live scoreboard snapshots every ~10 s, frozen from a per-user snapshot at cutoff.
7. **Redeem prizes.** Staff scan your tag; UID must match your account; each of `STAMP` / `RANKING` / `EXTERNAL` claims once.
8. **Print your card.** Design a face in the pixel editor, submit, get a Code 128 barcode, and the souvenir booth prints a CR80 PVC card — whose *own* NTAG staff can then pair to your account as a replacement badge.

```text
Install app + SSO/KKTIX login (JWT, 6-byte nfc_tag_key)
  -> pair badge NTAG (write URL + AAR, lock read-only)
  -> meet another attendee:
       tap their tag -> POST /collection/scan (UID must map
       to the user) -> card collected, +10
       click a shared link -> POST /collection/phishing,
       the opener is docked -10
  -> sponsor booth tag: +1 stamp (20 stamps = prize)
  -> live scoreboard (~10s snapshots, frozen at cutoff)
  -> staff scans your tag to claim STAMP / RANKING / EXTERNAL
  -> print a real PVC card; its NTAG pairs as a replacement badge
```

The tap itself, as a sequence:

```text
Scanner's phone -- NFC field --> victim's badge NTAG
badge            -- NDEF: https://game.hitcon2026.online/b?u=<id>
phone            -- reads the physical UID (7 bytes)
phone            -- POST /collection/scan {tag_uid, victim_id}
server           -- is the UID really paired to victim_id?
                      yes -> profile returned, collection bumped, +10
                      no/mismatch -> rejected, no score
```

## 3. Feature tour

**Card & profile**
- **48×48 pixel card editor**: brush (3 sizes), eraser, bucket fill, color picker, undo/redo, grid toggle; per-theme palettes; Unifont typography; ID-1 aspect ratio preview.
- **Image sources**: blank canvas, **gallery import** (≤ 20 MB source, cropped), or one of **12 default pixel avatars** — hacker cats (orange tabby, brown tabby, tuxedo, siamese), hacker dogs (shiba, corgi, doberman, generic), dragon, rabbit, seal, and a HITCON hat. All shipped as **48×48 PNGs**.
- **Profile fields**: display name (≤ 100 bytes), up to **3 emoji**, an **HTTPS-only link**, bio (≤ 4096 bytes), card color (default gold). Default emoji ✨.
- **Hidden bio channel**: link + card color are smuggled inside your bio as `[[HITCON_CARD:v1:<base64url json>]]` (`card_bio_codec.dart`).

**Game**
- Collection gallery, card detail view, per-user collections; uncollected users only see `user_id`, `display_name`, `emoji`.
- **Achievements** with pixel badge art: `first_contact`, `hello_world`, `packet_collector`, `sponsor_scout`, `stamp_master`, `community_explorer`, `full_stack_social`, `nfc_online`, `phishing`, `solder_master`, `top_rank`, `prize_unlocked` — thresholds via remote config.
- Live **scoreboard** with freeze semantics; phishing detection enforcing physical taps.

**Platform**
- **Offline-first**: local stores for profile / collection / scoreboard / print order; retry banner; **backup/restore** collections to JSON or clipboard.
- **Remote config** (`game.hitcon2026.online/.well-known/nfc-battle-app-config.json`) with trust checks (HTTPS, `*.hitcon2026.online` only, port 443 — explicitly "to avoid routing the JWT to third parties"). Flags include `allowUserTagUnlock` and the Panasonic logo switches.
- **NTAG security service**: identifies NTAG213/215/216 via `GET_VERSION`, `PWD_AUTH` (0x1B) with password/PACK, protects memory from page 4 onward, can unlock for rewrite (password reset to `FF FF FF FF`).
- **Auth**: JWT in FlutterSecureStorage (with a legacy plaintext SharedPreferences migration path); no client-side signature verification; no refresh mechanism — expired is expired.
- **API client**: plain `HttpClient`, **no SSL pinning**, Bearer token, server error messages surfaced verbatim.
- **Staff mode**: pair/unpair tags, print station, scoreboard freeze/resume (`STAFF_DANGER_TOKEN`), NFC unlock lookup; staging test-token generator (`tool/generate_test_tokens.ps1`) that needs `JWT_SECRET` from the environment.

## 4. Printing — from pixel grid to PVC

**In-app artwork generation.** The editor re-renders your card inside a `RepaintBoundary` at print resolution: **638 × 1011 px × 2 = 1276 × 2022 px** — 600 DPI, portrait CR80 (ID-1, 53.98 × 85.60 mm), 4% corner radius, format tag `EVOLIS_PRIMACY_CR80_600DPI_PNG`. Plus a tiltable 3D print preview with spring-back animation.

**Ordering.** `POST /print-cards` uploads the PNG (≤ 4 MiB) to object storage and returns a short token rendered as a **Code 128 barcode**. Rate limits: 5/user and 300/Cloudflare-location per minute. New uploads replace old ones — remember this, it matters in §6.

**Booth station (`CardPrinter/`).** Docker-on-Windows, port 18080, pure Python 3.12 stdlib, zero pip installs. Staff scan your Code 128 barcode (browser `BarcodeDetector` → ZXing fallback → manual 8–32 char token → or an old Android phone as a USB scanner over ADB on a restricted port 18081), then a **STAFF JWT** (page memory only) fetches `GET /staff/print-cards/{token}`. The service **re-renders nothing** — it swaps `word/media/image1.png` inside a Word `.docx` calibration template (54.89 × 86 mm, sub-millimeter offsets, rounded corners; SHA-256-verified at startup). Staff print from Word at "original page size / 100%" with scaling disabled, out comes the card from an **Evolis Primacy**. The printed card's own NTAG then gets paired to your account.

```text
48x48 pixel-grid card editor
  -> RepaintBoundary re-render: 1276x2022 px, 600 DPI CR80
  -> POST /print-cards (PNG <= 4 MiB -> object storage)
  -> short token, shown as a Code 128 barcode
  -> booth staff scan the barcode (camera / ZXing / ADB phone)
  -> STAFF JWT: GET /staff/print-cards/{token}
  -> swap image1.png inside the SHA-256-verified docx template
  -> Word prints at 100% -> Evolis Primacy -> PVC card
  -> staff pair the card's NTAG (POST /staff/pair_user_tag)
```

## 5. How to hack it — the attack surface and the workflows

One pattern repeats across this entire codebase: **the server validates sizes and identities; the client validates aesthetics.** Anything that's a matter of taste — resolution, emoji count, colors, link hygiene — is only checked in Dart, which is to say, not really checked at all. Anything that touches score or identity is checked server-side and mostly holds.

```text
You, an attendee with a badge sticker
  |- your phone (you own it)
  |    |- 48x48 editor -- client-side only
  |    |- APK assets -- avatars are just PNGs
  |    |- JWT in secure storage (legacy plaintext copy possible)
  |    `- local profile / collection prefs
  |- on the wire (no pinning, plain Bearer)
  |    |- PATCH /users/me -- avatar: any PNG <= 256 KiB, no res check
  |    |- bio text field -- the codec channel
  |    `- POST /print-cards -- any PNG <= 4 MiB
  |- over the air
  |    |- PWD_AUTH is cleartext 32-bit -- sniffable
  |    `- UID clonable with magic tags (server checks UID<->user)
  `- tried and rejected
       |- URL forgery
       |- forged STAFF JWT
       `- redirecting the API to your own server
```

### 5.1 Workflow 0 — Get your token (the foundation)

Every API-level move below is just an HTTP call with your own JWT. The app keeps it in **FlutterSecureStorage**, so extraction paths, easiest first:

1. **Watch the login handoff.** `loginWithToken()` receives an already-issued token from the SSO side — if you can see that delivery (page/link/QR), you have the token.
2. **reFlutter repack.** No SSL pinning exists (`nfc_battle_api_client.dart` is a bare `HttpClient` + Bearer header), but stock Flutter ignores user-installed CAs — so plain mitmproxy sees nothing. [reFlutter](https://github.com/Impact-I/reFlutter) repackages the app with traffic routed to your proxy.
3. **Root / Frida.** `_jwtToken` sits in memory behind a plain getter, and the legacy migration path once kept tokens in plaintext SharedPreferences (`staging_jwt_token`) — old devices that never re-logged may still have it there.

Sanity check:

```bash
curl -s https://nfc-battle-api.hitcon2026.online/users/me \
  -H "Authorization: Bearer $JWT"
```

What *doesn't* work: `loginWithToken` only decodes the JWT locally (never verifies the signature), which tempts you to forge a `role: STAFF` token. The server verifies HMAC on every call, and staff endpoints additionally want `STAFF_DANGER_TOKEN`. Dead end.

### 5.2 Workflow 1 — The hi-res avatar (organizer-approved classic)

The editor funnels everything through a 48×48 grid (`_imageToPixelGridSimple(image, 48)`). The server only checks that `pixel_avatar_base64` decodes to a PNG **≤ 256 KiB — no dimension enforcement**. The renderer is `Image.memory(..., filterQuality: none)` — native resolution, nearest-neighbor. You do the math. Denny did, and his duck went to print.

```bash
B64=$(base64 -w0 duck.png)
curl -X PATCH https://nfc-battle-api.hitcon2026.online/users/me \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"pixel_avatar_base64\":\"$B64\"}"
```

Pick a resolution that scales cleanly (480×480, 960×960, 1024×1024) so nearest-neighbor doesn't alias. Then go stand in a queue — the payoff is every single person who scans you seeing the crispest card in the building, at 600 DPI on the printed card too.

```text
Default 48x48 avatar or gallery photo
  -> editor downsamples to the 48x48 grid
  -> 512 px PNG -> base64 -> PATCH /users/me

Attacker: curl / Burp / reFlutter
  -> PATCH /users/me with a custom PNG, any resolution <= 256 KiB
  -> everyone's card renderer (Image.memory, native resolution)
  -> crisp hi-res avatar in the app and on the 600 DPI print
```

### 5.3 Workflow 2 — Emoji wall, alien colors, glitch names

Same PATCH, different fields. All of these limits are client-side only:

| Field | Client says | Server says | What you do |
|---|---|---|---|
| `attribute_emoji` | max 3 (`_maxEmojiSelection = 3`) | ≤ 64 bytes | 64 bytes ≈ **16 emoji** — the emoji wall |
| `card_color` | theme palette | any ARGB int | alpha-channel games (`0x00FFFFFF` = transparent border weirdness) |
| `display_name` | plain text field | ≤ 100 UTF-8 bytes, no content filter mentioned | Zalgo, RTL overrides, single-line ASCII art on the leaderboard |
| `link` | HTTPS-only, blocks IPs/localhost/non-443 (`https_link_input.dart`) | length cap per spec | the validator is pure client-side; probe what the server tolerates |

```bash
curl -X PATCH https://nfc-battle-api.hitcon2026.online/users/me \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"attribute_emoji":"🦆🦆🦆🦆🦆🦆🦆🦆🦆🦆🦆🦆","card_color":2147483647}'
```

### 5.4 Workflow 3 — The bio covert channel

`card_bio_codec.dart` smuggles card config inside the bio as `[[HITCON_CARD:v1:<base64url of {"l": link, "c": color}>]]`. The decoder does `lastIndexOf`, so the *last* marker wins. Bio is a plain text field (≤ 4096 bytes, silently truncated at UTF-8 boundaries):

1. Take `{"l":"https://example.com","c":4294901760}`, base64url it (strip `=`), wrap in the marker.
2. Append to your bio via the same PATCH.

You've now set an arbitrary link and color without the editor ever opening — including colors that exist in no palette. Bonus experiment: get the marker chopped mid-string by the truncation and see how the `FormatException` fallback treats you.

### 5.5 Workflow 4 — APK asset swap (own the catalog)

The 12 default avatars are plain PNGs at `assets/flutter_assets/assets/images/default_avatars/` in the base split APK, and the picker renders them at native resolution with `FilterQuality.none`:

1. `tar -xf` the XAPK (it's a ZIP), extract `org.hitcon.nfcbattle.apk`.
2. Replace e.g. `hacker_dog_shiba.png` with your art (keep the filename), repack.
3. `zipalign`, re-sign all splits with `apksigner` (debug key is fine), `adb install-multiple`.

Effects: your picker tile is gorgeous — but **selecting it still downsamples to 48×48** (which itself mints an automatic "photo-mosaic" pixel avatar, see §6.3). Caveats: broken signature (uninstall the Play build first), `CHECK_LICENSE` sulks, and don't try to patch *logic* this way — Flutter AOT in `libapp.so` doesn't decompile like DEX. The network is the attack surface; the binary is a wall.

### 5.6 Workflow 5 — Clone a badge with a magic tag

The core anti-cheat (`POST /collection/scan` must present a UID paired to the user in the URL) makes plain NDEF copies and `u=<id>` links worthless. A **Gen2 magic tag** copies the UID too:

1. Read a target badge: UID + NDEF (`https://game.hitcon2026.online/b?u=<id>`).
2. Write both onto a UID-writable magic tag.
3. Anyone tapping the clone now performs a *legitimate-looking* scan and collects the target without meeting them.

Limits: it can't inflate the target's score (only the scanner's collection bumps), and scans are rate-limited (10/min/user). A distribution hack, not a score hack — and whether it's a prank or a nuisance depends entirely on the target's sense of humor.

### 5.7 Workflow 6 — Sniff the pairing, ransom a sticker (Proxmark special)

NTAG21x `PWD_AUTH` (command `0x1B`) transmits the 4-byte password **in cleartext over RF** — no mutual challenge — and `ntag_security_service.dart` unlocks any tag whose PACK matches. Meanwhile **all of a user's tags share one key**.

1. Snoop an unlock/pairing session (Proxmark3 snoop / Chameleon Ultra): capture the `1B <pwd>` frame and the PACK reply.
2. You now hold that user's key — to their entire badge fleet.
3. Escalating options: rewrite their NDEF URL to a different `u=` (every scan of their badge now fails the server check — they're uncollectable and will wonder why for an hour); or PWD_AUTH with *your* password and lock the tag — a **badge ransom** until staff re-pair.

Brute force is a fantasy: the keyspace is 2³² but each guess is a physical tap (tens of ms) — years of pressing a sticker. Sniffing is the only practical acquisition, and it means standing next to someone with visible hardware at a security conference. Choose your victim's sense of humor wisely.

### 5.8 Workflow 7 — Phishing-evasion lab work (experimental)

How does the app decide *tapped a tag* vs. *clicked a link*? `nfc_deep_link_service.dart` asks the native side (`takeNfcLaunch()` → `hasEvidence`, `isNfcIntent`, `uid`); physical-tag status requires a non-empty UID; and a UID-less request with the same userId within **3 seconds** of a real scan is dropped as anti-spoof. The experiment — deliver the deep link as an NFC-style intent with no tag:

```bash
adb shell am start -a android.nfc.action.NDEF_DISCOVERED \
  -d "https://game.hitcon2026.online/b?u=<victim_id>" org.hitcon.nfcbattle
```

If the native layer maps that action to `isNfcIntent = true` with no UID, the downstream routing gets interesting: not a `physicalTag` (nothing to submit to the scan API) but possibly not a `directLink` either — maybe the phishing report never fires. Best case: browse people's links penalty-free. Worst case: nothing. Untested against a live backend — a genuinely fun lab exercise either way.

### 5.9 Workflow 8 — Printing outside the spec

The pipeline is rigorous about *geometry* and hands-off about *content*: `POST /print-cards` takes any PNG ≤ 4 MiB, and the only content moderation in the loop is **a human at the booth previewing your card**. The printer will faithfully reproduce whatever you upload at 600 DPI. What you do with that is between you and the volunteer at 4 PM on day two.

### 5.10 Tried and rejected (save yourself the afternoon)

- **Forging scan URLs / sharing links** — server checks UID↔user; link-clickers dock themselves as phishing victims. "Actually tap it in person" is enforced, not aspirational.
- **Forged STAFF JWT** — HMAC verified server-side every call; dangerous ops need `STAFF_DANGER_TOKEN`.
- **Pointing the app at your own server** — remote config accepts only `*.hitcon2026.online` HTTPS ("to avoid routing the JWT to third parties").
- **Swapping the booth's docx template** — SHA-256 verified at startup. Genuinely well done.
- **Editing local prefs to fake a collection** — score is server-side; your flex is a screenshot only you see. (The backup/restore JSON has no cryptographic account binding either — same cosmetic story.)
- **Freeze-time races** — the freeze uses a per-user snapshot at cutoff; late scans just don't count.

## 6. Fun feature misuse — the "it's not a bug" department

The hacks above bend the rules. These ones don't even break anything — they're the game's own features, used with intent.

### 6.1 Make your card *be* a QR code

The editor is a 48×48 black-and-white grid if you want it to be — and a **QR version 6 (41×41 modules) fits inside 48×48**. Draw your link as a QR into the card face, and suddenly anyone photographing your card in their collection can scan it with a camera. Combine with §5.2 and your *avatar itself* becomes a scannable, high-resolution QR — your card in someone's collection is now a flyer that opens your site. The purest possible version of "business card".

### 6.2 Dual-wield phones (the score hack nobody patched)

Here's the thing about the score formula: points go to the **scanner**, and the scanner is just *whoever's phone is holding the JWT*. Nothing in the spec ties an account to one device. So: sign the app in on your spare phone, hand it to a friend, and now **two scanners farm the crowd in parallel for one scoreboard slot**. Rate limit is 10 scans/min *per user* — two phones double your effective throughput up to that cap. Reasoned from the API spec rather than tested live, but there's no visible mechanism that stops it. Denny walked the ice-cream queue solo; imagine the queue with a wingman.

```text
Friend holds your signed-in spare phone.
  tap attendee A's badge -> POST /collection/scan -> +10 to you
  tap attendee B's badge -> POST /collection/scan -> +10 to you

You are elsewhere scanning with your own phone the whole time.
The rate limit (10 scans/min per user) is shared across both
phones, so two phones double your throughput up to that cap.
```

### 6.3 The photo-mosaic avatar (zero hacks required)

The gallery import funnels any photo through the 48×48 downsampler. Feed it a well-chosen portrait and the sampler mints a pixel avatar no human could draw cell-by-cell — a detailed, recognizable 2,304-pixel you. This works on a completely stock install; it's just a feature, used with taste. Pair it with §5.2 (upload the *original* high-res through the API) and people will think you hired an artist.

### 6.4 Rewrite your own badge (the impersonation prank)

If `allowUserTagUnlock` is on, you can unlock *your own* tag in-app (that's a feature), rewrite the URL, and re-lock. Point `u=` at somebody famous. Now every person who taps your badge gets the target's *public* mini-card (`user_id`, `display_name`, `emoji` — that's what uncollected users see) instead of you. The scan itself will fail the server's UID↔user check, so nobody "collects" anyone — it's purely a "why does my phone say I just tapped the keynote speaker" prank. Bonus variant: leave your *paired printed card* (§4) with a friend while you keep the sticker — the game now considers you collectable in two places at once. Decentralize yourself.

### 6.5 The last-second print swap

Print orders are "latest upload wins," the token is just a pointer, and the booth previews whatever the token fetches *at scan time*. So you can stand in the print queue with something respectable, and re-`POST /print-cards` a new design 30 seconds before reaching the volunteer. Whether you use this power for a surprise commission of a friend's card, a "the duck was inside you all along" reveal, or simply beating your own second thoughts — the pipeline supports your chaos. (5 uploads/min. The volunteer's patience is the real rate limit.)

### 6.6 The phishing mechanic, weaponized (use with conscience)

The penalty lands on the person who *opens* a link. Which means a poster with a big QR of your `/b?u=<you>` link and the caption "slides here" is, functionally, a −10 trap for everyone who scans it in a hurry. This isn't a vulnerability — it's the game teaching 2,000 hackers not to click links, the hard way. If you do this, own it: put your name under the QR and let the scoreboard's phishing column be your confession. (And yes, opening *your own* link docks *yourself*. Ask me how I know the spec says so.)

### 6.7 Collection cosplay

The collection backup/restore feature moves a JSON blob between devices with no cryptographic binding to your account. Restore a friend's 200-card backup onto your phone and your app now displays their glorious collection. The server ignores all of it — score lives server-side — so this is purely a screenshot flex. Still, at a conference, "let me show you my collection" *is* the metagame.

### 6.8 Experiments to try on-site

- **Self-scan**: does the server block collecting your own tag? If not, that's +10 for touching your own badge. Science requires checking.
- **Staff-badge stamping**: booths without dedicated cards fall back to staff badge stickers — is *any* staff badge a stamp source, or only designated ones? The spec hints designated; the badge of a sufficiently good-natured staffer is the test apparatus.
- **The 3-second window**: tap someone's tag and immediately open their link from chat — does the dedup window swallow the second event? `nfc_deep_link_service.dart` was written by someone who thought about this; verify their work.

## 7. Verdict

NFC Battle is a genuinely well-engineered piece of conference infrastructure: server-verified UID↔user pairing kills link spam, a phishing penalty enforces "actually meet people," offline-first storage survives a 2,000-person venue's Wi-Fi, and the print pipeline — 600 DPI artwork, Code 128 token, SHA-256-verified Word template, Evolis Primacy — is absurdly rigorous for a souvenir. Its most exploitable quirk is also its most charming: the backend trusts a ≤ 256 KiB PNG with **no dimension check**, so the 48×48 pixel-art level playing field is entirely client-side — and the organizer himself brought a rubber duck to that fight. Between the hi-res avatars, the QR cards, the dual-wield phones and the ice-cream queue, the real lesson is the one HITCON keeps teaching: the best attack surface at any conference is still the people.

---

## Appendix: source evidence map

| Claim | Source |
|---|---|
| Score = 10×collection − 10×phishing; ≥20 stamps; phishing penalty on opener | `Backend/game-flow.md` |
| Avatar PNG ≤ 256 KiB, no dimension enforcement; PATCH ≤ 512 KiB; print ≤ 4 MiB | `Backend/game-flow.md` constraints |
| 48×48 grid, 512 px export, `pixel_avatar_base64`, print artwork 1276×2022 @600 DPI, `EVOLIS_PRIMACY_CR80_600DPI_PNG` | `lib/pages/user/my_card_editor_page.dart` |
| 12 default avatars, `Image.asset` + `FilterQuality.none` picker | `default_avatar_catalog.dart`, `default_avatar_picker_page.dart` |
| `Image.memory(..., filterQuality: none)` card rendering | `lib/pages/user/card_detail_page.dart` |
| `[[HITCON_CARD:v1:...]]` bio codec, `lastIndexOf` | `lib/services/card_bio_codec.dart` |
| Tag URL + AAR, manual URI record decode | `lib/services/nfc_tag_payload.dart` |
| NTAG213/215/216, PWD_AUTH 0x1B, page-4 protection, unlock reset | `lib/services/ntag_security_service.dart` |
| NFC-vs-link classification, `takeNfcLaunch`, 3s anti-spoof, dedup windows | `lib/services/nfc_deep_link_service.dart` |
| No SSL pinning, Bearer auth, verbatim error surfacing | `lib/services/nfc_battle_api_client.dart` |
| JWT in FlutterSecureStorage, legacy plaintext migration, decode-only local check | `lib/services/auth_service.dart` |
| HTTPS link validator client-side only | `lib/pages/user/https_link_input.dart` |
| Remote config pinning, `allowUserTagUnlock`, Panasonic flags | `lib/config/app_config.dart` |
| Docx template swap, SHA-256 verify, ZXing, ADB scanner, staff JWT handling | `CardPrinter/README.md` |
| 48×48 default avatar PNGs, v0.5.1, split APKs, permissions | XAPK teardown (`manifest.json`, `flutter_assets/`) |
| Hi-res avatar confession, 39C3 origin, ice-cream queue | Denny Huang ([@denny0223](https://www.threads.com/@denny0223/post/DcYUOclj-gx)) post-event Threads note |
