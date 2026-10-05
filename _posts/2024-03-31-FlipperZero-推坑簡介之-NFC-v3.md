---
layout: post
title: "FlipperZero 推坑簡介之 NFC (v3)"
date: 2024-03-31 12:00:00 +0000
slug: "FlipperZero-推坑簡介之-NFC-v3"
tags: [FlipperZero, NFC]
---
話說我買咗 Flipper Zero 咁耐都未認真用過，要不是 Mystiz 邀請寫文我都未認真睇有咩玩。（大誤）

簡單講 Flipper Zero 就係一把 Hardware Hacking 嘅萬用刀，雖然每樣功能都未必係最優秀，但係細細隻係會你想拎出街把玩嘅玩具。今期主要會簡單介紹下當中功能。

係半隻手板咁大嘅 Flipper Zero 可以支援下面嘅功能：

  - NFC (High Frequency Card)
  - RFID (Low Frequency Card)
  - Sub-1 GHz Transceiver
  - Infrared Transmitter
  - GPIO Pin
  - iButton
  - 仲有內置小工具

### Firmware Flashing

係玩 Flipper Zero 之前，我會建議先 Flash 咗個 Firmware 佢。Flipper Zero 原生嘅 Firmware 上面 Block 咗某啲功能，例如 Sub-1 GHz 某啲 Frequency 嘅傳輸。如果想 Unlock 所有 Feature 的話可以考慮 [Xtreme Firmware](https://flipper-xtre.me/)[^1] 或者 [Unleashed Firmware](https://flipperunleashed.com/)[^2]，兩款firmware 除咗解鎖咗 feature 之外，仲會包埋其他 developers 嘅 plugin 入去，集各家之大成。

甚至覺得唔夠的話可以睇埋 GitHub [all-the-plugins](https://github.com/xMasterX/all-the-plugins)[^3], 下載自己適用嘅 plugin。

註：Flipper Zero plugin 需要 compile 同 Firmware 夾 version，未必一 down 就用得。

註2：係我交咗文之後幾日，XFW 嘅主要 contributor 出走自己整咗 [Momentum FM](https://momentum-fw.dev/)[^4]，都幾好用。

### NFC

宜家坊間一般嘅門禁卡都會用 High-Frequency Card, 當中最弱嘅係 Mifare Classic 1k (絕對唔係講緊你的悠遊卡)。

Mifare Card 平常嘅攻擊手法有：

  - Bruteforce Attack (Nested Attack)
  - Sniff Key (Darkside Attack)

### Nested Attack

雖然 Mifare Classic 1k 有 16 個 encrypted sectors，拜佢用 LFSR 所賜只要解鎖到其中一個 就可以 Unlock 所有 Sector。(見 LFSR State Rollback)

而有啲廠商偷懶嘅原因用 default key or simple key 可以直接係 [NFC_keys](https://github.com/Stepzor11/NFC_keys/blob/main/mf_classic_dict.nfc)[^5] 搵到 。甚至我宜家用嘅 XFW Firmware 自己就包咗 3941 條 key。只要 User 爆到其中一個 sector 一條 Key 就可以了。

### Darkside Attack

如果咁唔好彩 Key 唔係 Dictionary 入面，只能用 Sniff 嘅方法 Read Key。Mifare standard 之中 Reader respond 會包含 4 bits of keystream，導致 Mifare card 上面嘅 key 可以解譯並截獲。不過 Flipper Zero 只能 Fuzz and Emulate card ID 去嘗試 trigger Reader Response，唔似 iCopyX 咁直接 intercept reader同 card 之間嘅 communication。

註：Flipper Zero 都做到 Darkside attack，使用 Detect Reader read 咗讀卡器嘅 Nonce 用 Mfkey32 解 key。

> ![image7]({{ site.baseurl }}/assets/images/flipperzero-nfc/image7.png)

> Flipper Zero 係咪Tama-gotchi？

> 的確無錯。

> ![image12]({{ site.baseurl }}/assets/images/flipperzero-nfc/image12.png)

> ![image11]({{ site.baseurl }}/assets/images/flipperzero-nfc/image11.png)

> Kickstarter 時代先有嘅黑色版本，屬尊爵不凡嘅 nuttyshell 所擁有。

> ![image2]({{ site.baseurl }}/assets/images/flipperzero-nfc/image2.png)

> 新台幣 329 嘅悠遊卡，Pika Pika

> ![image13]({{ site.baseurl }}/assets/images/flipperzero-nfc/image13.png)

> ![image5]({{ site.baseurl }}/assets/images/flipperzero-nfc/image5.png)

> ![image10]({{ site.baseurl }}/assets/images/flipperzero-nfc/image10.png)

> 借 Pentest 名義去 Crack Key

---

### RFID & Others

至於 Low Frequency Card (RFID), 基本上用 Wiegand format 無做 encryption， 直接 read 完 emulate 就可以，decrypt 都慳返。

當 Flipper Zero 成功 decrypt 卡片之後，就可以生產出一個 dump file，用於之後 emulation。而且唔一定係 Mifare Classic 先支援，Amiibo 嘅 NTAG 215 都適用。

香港八達通係用 FeliCa (NFC-F)，而台灣 iCash 2.0 用 Mifare DESFire, Flipper Zero 完全無反應。如果要針對 NFC craft attack，直接上 ProxMark 3 更划算。我嘗試用 Flipper Zero 去讀 iCash 2.0 卡片，但係卡住 read 唔到的。

But，當我拎出 iCopyXS (Compatible with ProxMark3) 之後一睇就知道係咩 standard，證明 Flipper Zero 距離 NFC hacking tools 仲有一段距離。現階段真係一隻好玩嘅玩具，只能欺負啲 less secure 嘅 system。

HITCON 2023 嘅禮包之一有一張 CUID card 嘅物體，當時官方話你知道係咩就好有用但係無點講清楚。CUID 其實係一張可以重複擦寫所有 sector 嘅 Mifare Classic 1k card，比一般嘅 UID card 更難發現佢嘅重複擦寫特性。因爲有啲 Reader 會嘗試係啪卡嘅時候係 Sector 0 寫入資料，可以寫入的話會 reject access。CUID 就係防止 detection 之下嘅產物。配合 Flipper Zero 可以係 Flipper Zero 有 Card dump 要 physical 插卡情況之下 access system。雖然講到好強大但係遇到 online system 時候 NFC 只會得返 Authentication 功能，失去 storage 嘅用途。

Update on 16 March 2023:

本來諗住係 UMC 卡過 data 返 CUID 發現卡關，如果你打算 clone 卡請務必睇咗先。

Mifare Classic original card 坊間叫 M1 卡，通常係廠出預 read-only。後來有啲人動歪心思想做啲 writeable 嘅 blank card，統稱叫 magic card。 Magic Card Gen 1 又叫 UID card，的確好用但係可以 write 所有 sector。之後又出咗 magic card Gen 2 (aka CUID card)。iCopyX 係可以直接 erase and write UID 同 CUID card。隨住時代進步不滿足於 Mifare Classic，有人研發咗 Ultimate Magic Card (UMC)，可以 emulate 埋 Ultralight / NTAG，多咗功能仲好啦可以 clone 埋 NAMCO 張 Ultralight。[^6]

BUT！ iCopyX 未用 new PM3 client，只能正確辨認 UID 同 CUID。而 Flipper Zero 只支援 UID 同 UMC，雖然萬用但係成本高不少：

UMC：>200 HKD

CUID / UID: <1 HKD

![image4]({{ site.baseurl }}/assets/images/flipperzero-nfc/image4.png)

![image1]({{ site.baseurl }}/assets/images/flipperzero-nfc/image1.png)

同埋 PM3 同 Flipper Zero NFC dump format 有少少唔同要自己轉換。

註：學費馬話齋今期 newsletter 啲位已經用完，要留返下次先可以 share 點做 conversion。

### 預告 (如果有下期)

就會講下 Flipper Zero 其他功能，好似點用 Infrared 功能係 OWASP Meetup 嘅時候操弄 Speaker 個 Projector 咁。亦會講下 iOS 17 嘅 BLE crash 點樣用 Flipper Zero 做 PoC。

註：我完場先玩嘅，沒有一個 Speaker 受到傷害。

> ![image3]({{ site.baseurl }}/assets/images/flipperzero-nfc/image3.png)

> 私貨乃木坂 iCash 2.0

> 但係畢業得七七八八

> ![image8]({{ site.baseurl }}/assets/images/flipperzero-nfc/image8.png)

> iCopyXS 高光時刻

> ![image6]({{ site.baseurl }}/assets/images/flipperzero-nfc/image6.png)

> HITCON 送嘅 CUID

> 再買要課金 100 新台幣

> ![image9]({{ site.baseurl }}/assets/images/flipperzero-nfc/image9.png)

> 紅色框框係 Projector Menu 被我撳咗出嚟

[^1]: https://flipper-xtre.me/

[^2]: https://flipperunleashed.com/

[^3]: https://github.com/xMasterX/all-the-plugins

[^4]: https://momentum-fw.dev/

[^5]: https://github.com/Stepzor11/NFC_keys/blob/main/mf_classic_dict.nfc

[^6]: https://github.com/RfidResearchGroup/proxmark3/blob/master/doc/magic_cards_notes.md
