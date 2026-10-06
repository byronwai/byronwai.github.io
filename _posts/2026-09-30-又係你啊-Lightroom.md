---
layout: post
title: "又係你啊 Lightroom"
date: 2026-09-30 12:00:00 +0000
slug: "又係你啊-Lightroom"
tags: [Photography, Lightroom]
---

[If there is not such a life](https://www.youtube.com/watch?v=YaTv86-1-pY)

眾所周知，Blackb6a 同 Adobe 有不共戴天之仇恨。借鑑 Y*D 用盜版 Lightroom 比人 hack 咗嘅經驗，Adobe 點都要用正版的。[^1]

咁 Lightroom 會有兩個版本：

- Local 嘅 Lightroom Classic
- Cloud 嘅 Lightroom (Lightroom CC)，可以係電腦手機 iPad 執相

但係咩叫正版呢？做開 media 嘅朋友會知道，某寶上面有唔少 300 蚊一年嘅 Adobe 全家桶，佢哋會比一個 account 你或者叫你比個 account 佢，會幫你加入佢哋嘅 Organization (OU)。

![image6]({{ site.baseurl }}/assets/images/lightroom/image6.png)

發現而家已經加價去到 600。

佢哋嘅 OU 通常用假辦學登記去扮一間正常學校申請 Adobe。但係 payment 係永遠都過唔到，一個月就會加你入新 OU。更差嘅情況就係 Adobe 每次更新 Adobe Cloud 就會 ban OU，三日一小 ban，五日一大 ban。

Lightroom 可以 cross-device 執相，太方便了。但係後來發現每次轉 OU 都會失去之前嘅 edit，如果你唔好彩係 ban 之前無 save 低個 edit (XMP)，或者未 export 出嚟，咁就無了無了。後尾發現，即使佢 ban OU，只要你 account 仲係 OU 之內，你仲有最後機會可以拎返晒所有嘅落 local。

咁點解唔用 Lightroom Classic？個問題就係我個 workflow 用 Lightroom 會快啲，可以通勤時間執相。即使要 re-export 轉 OU 都係咁話。

雖然但是，你轉一次 OU ，電腦上面就會有堆 cache on local。你用電腦開 Lightroom 佢最後都要依賴 local，只係佢嘅 file 唔再係正常 file 結構。意味住你拎咗啲 local cache 去第二部電腦，無 login 對應嘅 Adobe account and OU 的話，啲 edit record 同圖都無辦法用正常方法開到。

由於有次 Adobe 大 ban OU，某寶上面嘅 Adobe 都存檔死清光。某寶個 customer service 話，哎吔我哋無辦法開 OU，我教你哋用 GenP 啦。你有否看到我頭上那個大問號？我會唔會變下個 Y*D 的？

咁我只能搵新嘅“正版”，最後有朋友推介有舖可以用一個正常嘅 OU。好景不常，用咗個半月之後比人踢咗出 OU，最頭痕係啲 file 冇晒，渣都冇。

思考過後，我決定動用禁忌力量之，GLM！(其實我都係博下，萬一唔得我就重新執過啲相。)

### Target

廢話。不就是把圖片跟 progress recover 嗎？對，但是只對了一半。

當你影完相之後會有一個 RAW 檔 (ARW for Sony)，而相關的成品會 export 作 JPG / TIFF 等其他格式。Export 後的 progress 會消失不見，要儲存 progress 的話需要 XMP, ACR 的 sidecar 檔案。未來再 edit 的話只要同步將 RAW 檔與 XMP, ACR 同步匯入 Lightroom 即可。

所以我只需要 recover：

- RAW (ARW 原圖)
- XMP (Metadata, Editing instructions)
- ACR (Raster Mask)

甚至因為我 workflow 會直接 upload RAW 到 Lightroom，RAW 有 backup 也不一定需要。ACR 也可以透過 XMP 重新計算。RAW, XMP, ACR 三款 file 之後有機會再講。

### How we start

![image2]({{ site.baseurl }}/assets/images/lightroom/image2.png)

Lightroom tree view

開始前我要睇我個 cache 有啲咩先。有兩樣野係值得留意的 (in orange color)：

- Managed Catalog.*
- settings\*.*

如果你睇返 Adobe 官方嘅 notes[^2]，會發現 Managed Catalog 嘅結構同 Lightroom Classic 如出一轍，包含 .mcat 同 .wfindex。既然佢哋唔係新野，會有 image edit history 係入面[^3]，咁就可以繼續開工。.mcat 負責 CBOR 而 .wfindex (Window Function Index) 略等於 SQLite file。咁理論上睇 .wfindex 已經夠做。

![image5]({{ site.baseurl }}/assets/images/lightroom/image5.png)

Adobe 無 notes 但係 BanG Dream! 有 Our Notes

### SQLite

![image3]({{ site.baseurl }}/assets/images/lightroom/image3.png)

Managed Catalog.wfindex 結構

繼續拆 .wfindex 嘅時候會發現，table purgeCandidates 儲存將移除嘅檔案。同時發現 purgeCandidates.binaryType：

- xmp_develop -> XMP
- aux -> Mask / Gen AI (partial ACR data)

![image4]({{ site.baseurl }}/assets/images/lightroom/image4.png)

.wfindex table structure

咁啱佢同 settings folder 入面嘅 SHA256 對得上，用我自己 DSC02091.ARW 嘅 XMP 去做例子。

![image1]({{ site.baseurl }}/assets/images/lightroom/image1.png)

.wfindex table structure

後來嘅 XMP 只需要對返 hash，或者 purgeCandidates.docId, purgeCandidates. assetId 都可以 pair up RAW 檔同 XMP file。

### Lesson Learned (?)

Adobe 正垃圾。啲 file spec 全部都唔講，account remove from OU 又無機會拎返啲野走。

如果你想知道多啲成個 recovery flow 同埋 XMP sidecar 原理，歡迎去我個 [repo](https://github.com/byronwai/lightroom-recovery)[^4] 睇多啲。

同埋記得唔好亂下載盜版。

問我知唔知一開始要睇 settings\*.*？當然唔知，佢係 SHA256 中先知啱的。

[^1]: 睇返前期嘅 YMD got Hacked, GG!!!

[^2]: https://helpx.adobe.com/hk_zh/lightroom-classic/desktop/kb/local-sync-database.html

[^3]: https://fileinfo.com/zh/extension/mcat

[^4]: https://github.com/byronwai/lightroom-recovery
