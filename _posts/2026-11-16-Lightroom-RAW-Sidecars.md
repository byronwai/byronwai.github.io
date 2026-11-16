---
title: "Lightroom RAW & Sidecars"
date: 2026-11-16 08:00:00 +0000
slug: "Lightroom-RAW-Sidecars"
tags: [Photography, Lightroom, Reverse Engineering, File Format]
---

## 前言

是咁的，由於之前做 Lightroom Recovery 個陣要 handle 唔少 file format 上嘅野，我決定去寫一篇講解用 Lightroom 執相嘅時候會用到嘅 files。

係 Lightroom Export 相嘅時候，除咗會 Export as JPG 返圖之外，有時會想 Export 個 edit record 比未來嘅自己 (或者幫我執屎嘅人) 去做 refinement，會有一個 “Original + Setting” 嘅 option.

![Lightroom export: Original + Settings]({{ site.baseurl }}/assets/images/lightroom/lr-export-option.png)

Export 完之後就會有以下嘅 files:

- ARW
- XMP
- ACR

![The exported files]({{ site.baseurl }}/assets/images/lightroom/lr-export-files.png)

以下嘅 File Analysis 都會基於 DSC03049 做 Example.

### TL;DR

- ARW: Sony RAW sensor data
- XMP: 曝光顏色調整, Parametric Mask
- ACR: AI generate 嘅 raster mask, 無咗的話可以依靠 XMP 重新計算

![DSC03049 as a shader pipeline: ARW in, XMP and ACR passes, JPG out]({{ site.baseurl }}/assets/images/lightroom/blog-shader-pipeline.png)

## 個 Pipeline 點睇

將成個 edit 當係一條 shader pipeline 去諗會易明好多：

- **ARW** = input texture，即係 sensor 見到嘅嘢
- **XMP** = program，global 嘅 uniform (白平衡、曝光、對比) 加一堆 pass，每個 pass 有個 mask 同幾個數字
- **ACR** = AI model 預先 bake 好嘅 texture，咁就唔使每次 render 都要再行一次 model
- **JPG** = framebuffer

由下至上咁睇：

- **Pass 0**：decode RAW + global setting。Camera ST profile、WB 3300K / +5、Exposure −0.50、HSL、陰影加少少 teal split-toning。數字係喺 XMP 度，但係點樣解讀呢啲數字嘅 colour science 喺 Adobe 個 engine 入面，所以 pass 0 嗰塊係 Lightroom 真係 render 出嚟嘅 (關晒 mask 同 Remove 再 export 一次)
- **Pass 1**：Generative Remove，用 Firefly 鏟走右邊條柱。Selection、fill mask、三個候選、連埋張收據都喺 ACR 入面
- **Pass 2–4**：AI mask (Background ∪ Architecture ∪ Sky、Subject、Vegetation)。Mask 本身係 ACR 入面嘅 raster，XMP 淨係記住調整嘅數字
- **Pass 5**：Parametric mask (linear、radial、range)。完全冇 raster，XMP 記住幾何形狀，每次 render 重新計過

> 個 stack 係跟 XMP 嘅次序畫。Adobe 冇公開 engine 內部真正嘅 pass order，所以當佢係「file 入面有咩」，唔好當係「GPU 先做咩」。

## TIFF 五分鐘速成

三個 file 入面有兩個底層都係 TIFF：ARW 頭四個 byte 係 `49 49 2A 00` (`II*\0`)，ACR 入面每個 raster record 跳過 16 byte 之後又係呢四個 byte。所以先講 TIFF，講一次就夠。

![TIFF is a pointer chase: header, IFD, 12-byte entries]({{ site.baseurl }}/assets/images/lightroom/blog-tiff-pointer-chase.png)

PNG 係 stream，由頭讀到尾；TIFF 係 pointer chase。Header 指去 IFD (image file directory)，IFD 每個 entry 12 byte：tag、type、count、value。重點係最後嗰 4 byte：放得落就直接放 value (例如 `ImageWidth = 7168`)，放唔落就放 offset 叫你跳過去 (例如 41.6 MB 嘅 sensor data 喺 `0x3D0000`)。

## ARW：Input

Sony 冇自己發明 container，ARW 就係 TIFF/EP 加一堆 Sony 私家 tag。Canon CR2、Nikon NEF 都係同一個套路；Canon CR3 同 Fuji RAF 就自成一派。

![DSC03049.ARW: where the bytes go, and the pointer chase to the photo]({{ site.baseurl }}/assets/images/lightroom/blog-arw-map.png)

幾樣值得留意：

- 45.6 MB 入面 **91% 係 sensor strip**，而佢唔喺 IFD0，係收埋喺 SubIFD 下面一層
- **IFD0 自己嘅 `0x0201` 只係一張 245 KB 嘅 preview**。真正 full-size 嘅 7008×4672 JPEG 要跟住 next-IFD 跳兩次，去到 IFD2 先搵到
- MakerNotes 係 38 KB 嘅 Sony 私家地帶，白平衡 matrix、lens correction 都喺度，所以每個 RAW decoder 都要寫 vendor-specific code

> **Recovery tip**：之前 recover 嗰陣有幾千張 metadata 冇晒嘅 render 要 match 返原相。做法就係 scan `FFD8`…`FFD9`，揀最大嗰段，啱啱好就係 IFD2 嗰張 full frame。

## XMP：Program

XMP 就係 XML，用 Notepad 都打得開。DSC03049.xmp 有 36,775 byte。

![XMP anatomy: numbers, points, recipes and pointers]({{ site.baseurl }}/assets/images/lightroom/blog-xmp-anatomy.png)

入面嘅嘢可以分四類：

- **Global slider = 數字**：`crs:Exposure2012="-0.50"`，一個 attribute 一行
- **Curve = 一串 point**：塞唔落 attribute 嘅就變做 child `rdf:Seq`
- **大部分 mask = recipe**：linear gradient 係 4 個 float、radial 係一個 box 加 feather、brush 就係筆劃。Engine 每次 render 重新計，一粒 pixel 都唔使存
- **AI mask 同 Remove = pointer**：model 嘅 output 冇得 100% 重現，所以 XMP 只係記住個 MD5 (`MaskDigest`) 同擺放位置 (`Origin`)，pixel 喺 ACR

![Two XMP rules: the name, and the envelope]({{ site.baseurl }}/assets/images/lightroom/blog-xmp-rules.png)

做 recovery 嗰陣最痛嘅兩課：

1. **個名要一字不差**。`DSC03049.xmp` 擺喺 `DSC03049.ARW` 隔籬就得，改做 `2026-09-25_DSC03049.xmp` 就會靜靜雞冇反應，連 warning 都冇。
2. **同一份 payload 有唔同嘅封套**。原本以為 export 會加 `<?xpacket?>`，原來冇。Lightroom export 出嚟嘅同 cache 入面一樣，係 bare `<x:xmpmeta>`。即係話 recovery 其實只需要 copy 個 blob，再改返個啱嘅名。

## ACR：Baked Textures

呢 part 先係重點，因為我搵唔到有人寫過 `.acr` 嘅 format。以下全部都係 hex dump 自己嘅 export 拆出嚟。

### 幾時先有 ACR？

![Which edits make an .acr: only the ones with computed pixels]({{ site.baseurl }}/assets/images/lightroom/blog-acr-when.png)

數過 84 個 export sidecar：有 AI mask 嘅 77 個全部有 ACR，冇 AI mask 嘅 7 個全部冇。即係話：**ACR 只會喺 edit 有 AI mask 嘅時候出現**。Remove 嘅 fill 會順便塞埋入去，但係複雜唔等於要 raster，再長嘅 brush stroke 都只係 recipe。只有 model 計出嚟嘅 pixel 先會被「凍結」。

### 拆開個 file

![Anatomy of DSC03049.acr]({{ site.baseurl }}/assets/images/lightroom/blog-acr-anatomy.png)

結構其實好簡單：

- **Header 20 byte**：magic `ACR\0`、version 1、來源格式 `ARW\0`、record 數目 N、一個永遠係 0 嘅 reserved
- **Table**：N 個 32 byte 嘅 entry (md5、size、offset)，**按 MD5 排序**，唔係按 XMP 次序。之前一直對唔到次序就係因為咁
- **Record**：4-byte align，有兩種：
  - **Raster** (11 個入面佔 10 個)：16 byte signature 加一個 TIFF，入面係 JPEG-XL tile (compression 52546)。Pillow 開唔到，`tifffile` + `imagecodecs` 就得
  - **zlib** (得 1 個)：Generative Remove 嘅「收據」，inflate 出嚟係一段 XMP。有趣嘅係 re-export 嗰陣 Adobe 清空咗入面嘅 `RequestInfo` 同 `ResponseInfo`，MD5 一變，個 record 喺 table 入面嘅位都跟住搬

### 入面有咩？

![DSC03049.acr taken apart and placed back on the photo]({{ site.baseurl }}/assets/images/lightroom/blog-acr-decomposed.png)

- 5 個 AI mask 都係 **crop 到 bounding box** 先存，只有 Background 係成張 frame。`Origin` 話你知要擺返去邊
- Mask 嘅 canvas (`FullMaskSize = 2880,1920`) 係 **sensor 方向**，即係打橫。要先 composite 再 rotate，調轉嚟做會錯位
- Generative Remove 全部嘢都喺 local：AI selection、fill mask、**三個 Firefly 生成嘅候選**、揀咗嘅嗰個，再加張收據。生成出嚟嘅 pixel 唔係淨係留喺 Adobe 個 server
- Vegetation 俾兩個 mask group 用，但只存一次：同一個 MD5，同一個 record

### Raster 點樣搵返自己個 Mask？

![MaskDigest in the XMP is the MD5 of the ACR record; Origin places it]({{ site.baseurl }}/assets/images/lightroom/blog-mask-binding.png)

答案係 **content addressing**：XMP 嘅 `MaskDigest` 就係 ACR record 嘅 MD5，cache 入面個 file 都係用呢個 MD5 命名。唔使 index，唔使次序，攞住個 hash 去 lookup 就得。77 個 file、311 個 record，一對一完全吻合。

## 砌返埋一齊

![From cache to export and back]({{ site.baseurl }}/assets/images/lightroom/blog-lifecycle.png)

- 三個 file 要喺**同一個 folder**、用**同一個 base name**
- RAW 一個 byte 都唔會改，XMP 就係 cache 入面嗰份 bare blob
- 有 ACR：mask 原封不動咁還原
- 冇 ACR：Lightroom 會用 XMP 嘅參數加自己嘅 AI model 重新計過，好接近，但唔保證一模一樣
- Offline 嘅話，ACR 其實可以由 cache 嘅 `auxiliary\` 砌返出嚟：header + 按 MD5 排好嘅 table + record，就係咁多

## 未解之謎

- `0x10` 嗰個 reserved u32 係用嚟做咩？
- 非 Sony 相機 (NEF、CR3、DNG) 嘅 source tag 會係咩？
- 淨係有 Generative Remove、冇 AI mask 嘅 edit 會唔會有 ACR？
- Lightroom 肯唔肯 import 一個自己砌出嚟嘅 ACR？

如果你手上有其他牌子相機嘅 export，一個 hex dump 就可以幫手填多一格。Reader script 同所有圖嘅 generator 都喺 [lightroom-recovery](https://github.com/byronwai/lightroom-recovery) (`scripts/acr_reader.py`、`scripts/make_blog_figures.py`)。

總之下次 export 記得連 ACR 一齊保留，唔係嘅話啲 AI mask 要重新計，未必同你當初執嗰張一模一樣。
