---
layout: single
title: "Manual Work"
date: 2026-09-30 12:00:00 +0000
slug: "Manual-Work"
tags: [DFIR, Photography]
---

## 前言

話説有日個同事凌晨三點問我，Hello 啊我啲想唔小心 overwrite 咗隻碟，有無救啊嗚嗚嗚。

![image]({{ site.baseurl }}/assets/images/manual-work/image.png)

![image 1]({{ site.baseurl }}/assets/images/manual-work/image_1.png)

咁 overwrite 咗仲有無得救呢？我理解佢會寫落同一個 block，咁即係無得救啦。不過來到來了，咁同事就比咗佢隻 external disk 我，一返工就擺咗係枱頭，即管睇下啦。

咁我通常都係會直接開 Autopsy 睇下，Autopsy 有自帶嘅 image recovery tool，咁我順手睇下個 unallocated space 有無野。

![image 2]({{ site.baseurl }}/assets/images/manual-work/image_2.png)

睇完之後發現咩都無。同埋 Autopsy 只能係撈起所有 files，其實我唔知邊啲係 overwrite 咗，邊啲唔係。當然同事話，我 overwrite 咗 9 月 6 個 folder 咋。但係我經驗話比我知，都係要 recovery 起曬所有野先判斷到。

咁當然我有 LLM token，我用 tool 又見唔到野，試下啦無壞嘅。

## Disk Analysis

首先本身嘅碟用 exFAT，打開 Logical Cluster Number (LCN) 一睇，本身嘅早期嘅檔案會有一個細嘅 LCN，後期再寫入會用一個大啲嘅 number。咁我地見到嘅係：

![free-run-map]({{ site.baseurl }}/assets/images/manual-work/free-run-map.png)

換人話講，我地知道：：

- 本身 6 Sept 嘅 file 而家 mainly 無咗
- 新寫去 overwrite 嘅 file 被指派去一個新嘅 LCN

咁即係無清零啦？可以開始救了。同埋我地直接知道 LCN 邊個 number range 踩落去睇。

> 💡 點解 Autopsy 睇唔到 unallocated space 有圖，到而家都係好迷。

## Delete? Overwrite?

咁睇返 Overwrite 嘅方法有兩款：

- 先 delete 再 write
- 真係寫返同一個 LCN

```text
copy replaces a same-named file
  -> replacement strategy?
       -> delete-and-recreate:
            old clusters freed, FAT entries zeroed + bitmap bits cleared
            -> allocator picks fresh clusters (moving first-fit hint,
               not history)
            -> does any later write land on the freed clusters?
                 yes -> old data destroyed there
                 no  -> old data SURVIVES as free-run remnants
       -> in-place rewrite:
            allocation kept, new bytes land in the same clusters
            -> old data destroyed only under the written range
```

咁明顯 Windows Explorer 係用第一種 "Lazy" flow，咁先可以救到。

exFAT 嘅 File Structure 係咁的 (<https://blog.1234n6.com/exfat-timestamps-exfat-primer-and-my-methodology/>)

![image 3]({{ site.baseurl }}/assets/images/manual-work/image_3.png)

當你 Delete file 嘅時候，會直接將 Address `0x10` 嘅 entry type 由 `0x85` 改做 `0x40`, mark as deleted。

![exfat-layout]({{ site.baseurl }}/assets/images/manual-work/exfat-layout.png)

## JPEG Crafting

本身諗住用 PhotoRec CLI 做的，但係因為我瞓咗，AI bypass 唔到 UAC，咁佢就自己寫咗個 JPEG Craver。

撇除啲好複雜嘅野，Canon 嘅 JPEG 出世嘅時候係會 EXIF 入面包住個 thumbnail。簡單講就係 TIFF in JPEG 咁，會見到兩次 EOI，recovery 有機會令正常 parser 爛咗。

![jpeg-structure]({{ site.baseurl }}/assets/images/manual-work/jpeg-structure.png)

## Recovery

發現原來 copy 咗兩次 13 Sept 嘅相入去，有兩款唔同嘅 time stamp，其實係 overwrite 咗兩次。咁我唔需要再好似 Autopsy 咁掃曬成個 Unallocated Space，根據 LCN 睇大概 130 GB data 就可以了。同 being overwrite 嘅 107GB data 相似。

咁用以下嘅 flow 寫咗少少 parser 就可以了。

![carve-pipeline]({{ site.baseurl }}/assets/images/manual-work/carve-pipeline.png)

## Result

最後冇事。

![result]({{ site.baseurl }}/assets/images/manual-work/result.png)

- Recover 返 6,691 張相，total 103.22 GB，EXIF 2026:09:06 19:19 - 20:07.
- 仲有少少片

## Summary

```text
Recovered EXIF coverage vs video gaps (06 Sept evening, 2026)

19:19 - 19:26  stills (7m)
19:25 - 19:32  gap = REEL_0082 video (7m)
19:32 - 19:35  stills (3m)
19:34 - 19:38  gap = video (4m)
19:38 - 19:39  stills (1m)
19:39 - 19:42  gap = video (3m)
19:42 - 19:53  stills (11m)
19:52 - 19:56  gap = video (4m)
19:56 - 20:00  stills (4m)
19:59 - 20:04  gap = video (5m)
20:04 - 20:08  stills (4m)
```

| When (2026) | Event | Evidence |
|---|---|---|
| 06 Sept 19:18 | The 06-Sept card is copied to `E:\260906` (photos → `DCIM\100EOSR5`, videos → `XFVC\REEL_0082`) | folder mtimes 19:18:34; video names `…H260906_193218…` |
| 10 Sept 00:37 | Older cards copied to `E:\260822`, `E:\260905` | folder creation times |
| 10 Sept 21:29 | **Overwrite wave 1** — a copy session writes files `0E3A0001–0E3A6691` into the same folder, reusing freed 06-Sept clusters | creation times 21:29:42+, one file per second for 6,691 files |
| 13 Sept 17:38–20:18 | New shoot: ~29.5k photos across `100/101/102EOSR5` on the card | EXIF `DateTimeOriginal` of the current files |
| 14 Sept 14:55 | The 13-Sept card is copied to `E:\260913` (intact copy) | folder mtimes |
| 14 Sept 19:18–22:37 | **Overwrite wave 2** — the 13-Sept shoot is copied into `E:\260906`: in-place content replacement for `0E3A0001–6691` (creation times preserved, mtime = capture time — *not* Explorer-style delete+recreate), fresh files `6692–9999` plus `101/102EOSR5` | mixed creation dates over uniform 13-Sept EXIF |

## 後記

多謝同事請我食壽司郎。

同埋原來個啲圖 overwrite 咗兩次。

![image 4]({{ site.baseurl }}/assets/images/manual-work/image_4.png)

有興趣就自己上 <https://github.com/byronwai/exfat-jpeg-recovery> 睇 full repo，多謝大家。
