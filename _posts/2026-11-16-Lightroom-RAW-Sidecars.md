---
title: "Lightroom RAW & Sidecars"
date: 2026-11-16 08:00:00 +0000
slug: "Lightroom-RAW-Sidecars"
tags: [Photography, Lightroom, Reverse Engineering, File Format]
---

## TL;DR

- ARW: Sony RAW sensor data
- XMP: Program, 曝光顏色調整, Parametric Mask
- ACR: AI generate 嘅 raster mask 同 Remove patch。無咗可能要重新計算，唔保證還原到同一個結果

![DSC03049 as a shader pipeline: ARW in, XMP and ACR passes, JPG out]({{ site.baseurl }}/assets/images/lightroom/blog-shader-pipeline.png)

> 個 stack 係跟 XMP 嘅次序畫。Adobe 冇公開 engine 內部真正嘅 pass order，所以當佢係file 入面有咩。

## 前言

是咁的，由於之前做 Lightroom Recovery 個陣要 handle 唔少 file format 上嘅野，我決定去寫一篇講解用 Lightroom 執相嘅時候會用到嘅 files。

係 Lightroom Export 相嘅時候，除咗會 Export as JPG 返圖之外，有時會想 Export 個 edit record 比未來嘅自己 (或者幫我執屎嘅人) 去做 refinement，會有一個 “Original + Setting” 嘅 option.

![Lightroom export: Original + Settings]({{ site.baseurl }}/assets/images/lightroom/lr-export-option.png)

Export 完之後就會有以下嘅 files:

- ARW
- XMP
- ACR

![The exported files]({{ site.baseurl }}/assets/images/lightroom/lr-export-files.png)

> 以下嘅 File Analysis 都會基於 DSC03049 做 Example.

## File Format

### TIFF 五分鐘速成

三個 file 入面有兩個底層都係 TIFF：ARW 頭四個 byte 係 `49 49 2A 00` (`II*\0`)，ACR 入面每個 raster record 跳過 16 byte 之後又係呢四個 byte。

![TIFF is a pointer chase: header, IFD, 12-byte entries]({{ site.baseurl }}/assets/images/lightroom/blog-tiff-pointer-chase.png)

PNG 係 stream，由頭讀到尾；TIFF 係 pointer chase。Header 指去 IFD (image file directory)，IFD 每個 entry 12 byte：tag、type、count、value。重點係最後嗰 4 byte：放得落就直接放 value (例如 `ImageWidth = 7168`)，放唔落就放 offset 叫你跳過去 (例如 41.6 MB 嘅 sensor data 喺 `0x3D0000`)。

### ARW

Sony 冇自己發明 container，ARW 就係 TIFF/EP 加一堆 Sony 私家 tag。Canon CR2，Nikon NEF 都係同一個套路；Canon CR3 同 Fuji RAF 就自成一派（CR3 喺[下面](#cr3)拆咗）。

![DSC03049.ARW: where the bytes go, and the pointer chase to the photo]({{ site.baseurl }}/assets/images/lightroom/blog-arw-map.png)

幾樣值得留意：

- 45.6 MB 入面 91% 係 sensor strip，而佢唔喺 IFD0，係收埋喺 SubIFD 下面一層
- IFD0 自己嘅 `0x0201` 只係一張 245 KB 嘅 preview。真正 full-size 嘅 7008×4672 JPEG 要跟住 next-IFD 跳兩次，去到 IFD2 先搵到
- MakerNotes 係 38 KB 嘅 Sony 私家地帶，白平衡 matrix，lens correction 都喺度，所以每個 RAW decoder 都要寫 vendor-specific code

> Recovery tip：之前 recover 嗰陣有幾千張 metadata 冇晒嘅 render 要 match 返原相。做法就係 scan `FFD8`…`FFD9`，揀最大嗰段，啱啱好就係 IFD2 嗰張 full frame。

### CR3

補記（2026-11-21）：有人 send 咗張 Canon EOS R50 嘅 CR3 嚟，順手拆埋。

CR3 唔係 TIFF。佢用 ISO Base Media File Format，即係 MP4 同 HEIF 嗰套：每個 box 頭 4 byte 係 size，跟住 4 byte 係 type，一層包一層。`ftyp` 嘅 brand 係 `crx `。

![IMG_9055.CR3: where the bytes go, and the box chase to the photo]({{ site.baseurl }}/assets/images/lightroom/blog-cr3-map.png)

IMG_9055.CR3（33.1 MB）大概係咁：

| Box | 內容 | Size |
|---|---|---:|
| `moov` → `uuid`（Canon） | `CMT1`–`CMT4` metadata，`THMB` 160×120 縮圖 | 29 KB |
| `moov` → `trak` ×4 | 每條 track 一個 table，記住 data 喺 `mdat` 邊度 | 2 KB |
| `uuid`（XMP） | 只有 `<xmp:Rating>0</xmp:Rating>`，其餘全部係 padding | 64 KB |
| `uuid`（PRVW） | 1620×1080 preview JPEG | 394 KB |
| `mdat` | 四條 track 嘅實際 data | 32.6 MB |

`mdat` 入面四條 track：

1. 6000×4000 full-size JPEG（3.6 MB）
2. 1624×1080 細 RAW
3. 6000×4000 CRAW sensor data（27.1 MB，成個 file 嘅 82%）
4. CTMD timed metadata

同 ARW 比，幾樣值得留意：

- TIFF 其實冇死。`CMT1`–`CMT4` 每個都係一個細 TIFF（`II*\0`）：IFD0（Make、Model、Orientation）、EXIF（光圈、快門、RF50mm F1.8 STM）、MakerNote、GPS。上面嗰套 pointer chase 照用，只係外面包多咗一層 box
- Full-size JPEG 唔使跳 next-IFD，跟 track 1 嘅 `co64` offset 就搵到。Recovery 嗰招 scan `FFD8` 揀最大嗰段，一樣 work
- 白平衡唔喺 MakerNote。R50 將 `ColorData` 搬咗去 CTMD 第 8 類 record（ExifTool 叫 ColorData11，version 48，R7、R10、R50、R6 Mark II 共用）。Index 105 係 as-shot RGGB `1777/1024/1024/1736`，index 109 直接寫住 `5200` K。Sony 要用幾個 Kelvin preset 內插先估到色溫，Canon 就直接話你知
- Lens correction 亦都喺 CTMD。`VignettingCorr2` 寫住 peripheral illumination、chromatic aberration、Digital Lens Optimizer 都係 On，但 distortion correction 係 **Off**，即係呢張 camera JPEG 冇做變形校正。Sony 嗰張要將 AI mask warp 一次先對得準；呢張理論上唔使。所以 compiler 要逐張讀呢個 flag，唔可以當晒所有相機一樣

可惜今次只有一張 Lightroom iOS export 嘅 JPG（2048×1537，crop 咗做接近 4:3），冇 XMP 同 ACR，所以 Canon 嗰邊嘅 sidecar 行為未驗證到。

### XMP

XMP 就是 XML。略等於最終 Output 生成嘅 prompt。

![XMP anatomy: numbers, points, recipes and pointers]({{ site.baseurl }}/assets/images/lightroom/blog-xmp-anatomy.png)

入面嘅嘢可以分四類：

- Global slider
  - 其實就係基本 adjustment parameter
  - `crs:Exposure2012="-0.50"`，一個 attribute 一行
- Tone Curve
  - 一串 point。塞唔落 attribute 嘅就變做 child `rdf:Seq`
- Parametric Mask
  - recipe: linear gradient, radial, brush
  - Engine 每次 render 會 real time 計，毋須 save
- AI mask & Remove
  - pointer-like
  - AI mask 用 `MaskDigest` 指去 ACR 嘅 raster，`Origin` 記住擺放位置
  - Remove 就用 `pm_patch` 同 `pm_patch_mask` 指去揀中嘅補圖同 blend mask，另外記住 target rectangle；pixel 一樣喺 ACR

![Two XMP rules: the name, and the envelope]({{ site.baseurl }}/assets/images/lightroom/blog-xmp-rules.png)

做 recovery 嗰慘係同一個 payload 有唔同嘅 envelope。原本以為 export 會加 `<?xpacket?>`，原來冇。Lightroom export 出嚟嘅同 cache 入面一樣，係 bare `<x:xmpmeta>`。即係話 recovery 其實只需要 copy 個 blob，再改返個啱嘅名。

## ACR

由於我搵唔到有人寫過 `.acr` 嘅 dissection，以下係自己用 Adobe Lightroom Version 10.0 (Nov 2026) export 出嚟。如果同你理解唔同的話請同我講。

> 咩話？上次 Lightroom 死過仲未轉用 Classic？

#### 何時會建立 ACR 附屬檔案?

根據 Adobe 嘅[官方説明](https://helpx.adobe.com/hk_zh/lightroom-classic/desktop/organize-photos-in-lightroom-classic/create-xmp-acr-files.html)：

> 從 Lightroom Classic (15.0 版) 版本開始，Lightroom 會識別是否有任何大量編輯、遮色片，或如「超解析度」、「干擾物移除」和「雜色減少」等 AI 設定。 它會將大量編輯寫入 ACR 附屬檔案，同時保持 XMP 附屬檔案的輕量化。 如果沒有任何大量編輯，Lightroom 將繼續將中繼資料變更寫入 XMP 附屬檔案。 每當儲存中繼資料時 (透過中繼資料偏好設定)，寫入附屬檔案的操作就會繼續進行。 使用 Lightroom 移動/重新命名/刪除影像時，其也會維護所有附屬檔案的生命週期。

即係牽涉 AI generation 嘅 Object 就會用 ACR 額外存起。

#### 拆！

![Anatomy of DSC03049.acr]({{ site.baseurl }}/assets/images/lightroom/blog-acr-anatomy.png)

簡單講：

- **Header 20 byte**
  - magic header `ACR\0`, version 1, 來源格式 `ARW\0`, record 數目 N,  reserved “0”
- **Table**
  - N 個 32 byte 嘅 entry (md5、size、offset)
  - 按 MD5 排序，並非以 XMP 次序排列
- **Record**
  - 4-byte align，有兩種：
    - **Raster** (11 個入面佔 10 個)：16 byte signature 加一個 TIFF，入面係 JPEG-XL tile (compression 52546)。Pillow 開唔到，`tifffile` + `imagecodecs` 就得
    - **zlib** (得 1 個)：Generative Remove 嘅「收據」，inflate 出嚟係一段 XMP。有趣嘅係 re-export 嗰陣 Adobe 清空咗入面嘅 `RequestInfo` 同 `ResponseInfo`，MD5 一變，個 record 喺 table 入面嘅位都跟住搬

#### Visualization

![DSC03049.acr taken apart and placed back on the photo]({{ site.baseurl }}/assets/images/lightroom/blog-acr-decomposed.png)

- 5 個 AI mask 都係 **crop 到 bounding box** 先存，只有 Background 係成張 frame。`Origin` 話你知要擺返去邊
- Mask 嘅 canvas (`FullMaskSize = 2880,1920`) 係跟隨 **sensor orientation** (aka打橫)。要先 composite 再 rotate，調轉嚟做會錯位
- AI selection，fill mask，GenAI 生成嘅候選 and the chosen one。生成出嚟嘅 mask 唔係淨係留喺 Adobe 個 server，會 save as local。
- Vegetation 俾兩個 mask group 用，但只存一次：同一個 MD5，同一個 record

> 條龍 Lightroom 當咗係 Vegetation…

#### Raster 點樣搵返自己個 Mask？

![MaskDigest in the XMP is the MD5 of the ACR record; Origin places it]({{ site.baseurl }}/assets/images/lightroom/blog-mask-binding.png)

答案係 **content addressing。** XMP 嘅 `MaskDigest` 就係 ACR record 嘅 MD5，cache 入面個 file 都係用呢個 MD5 命名。直接拎 hash 去 lookup 就得。之前我餵咗其他 folder (XMP + ACR) 嘅結構比 Claude，完全吻合的。

#### 補記：GenAI Remove 原來有另一個入口（2026-11-20）

之後用另一張相 DSC06771 試自己寫嘅 compiler，發現左上角明明喺 Lightroom 移除咗嘅樹枝，compile 完又出返嚟。唔係 ACR 冇帶齊，而係呢份 XMP 將嗰個 edit 放咗喺 `RetouchAreas`，之前個 parser 只讀 `RemoveAreas`，於是成個 pass 被漏咗。

呢個 entry 係 `SpotType="heal_patchmatch"`、`fill_method="firefly"`，一樣有 `pm_patch` 同 `pm_patch_mask`。跟住兩個 hash 去 ACR 搵，揀中嘅補圖同 blend mask 都仲喺度，唔使重新叫 AI 生過。修正之後，compiled image 同兩款 Reel 嘅成品畫面都有套用返個 removal。

所以寫 reader 唔可以淨係認一個 container name；兩個 sequence 都要睇，再確認 entry 有冇對應嘅 patch。`RetouchAreas` 亦可能包含傳統 heal / clone，唔係見到個名就當全部都係 GenAI。以上係呢組實際檔案驗證到嘅行為，唔代表已經拆晒 Adobe 所有版本。

## 自己砌個 Sidecar Compiler

拆完唔想淨係睇 hex，所以砌咗個 [LR Sidecar Compiler](https://lr-sidecar.byronwai.workers.dev/)，[source 喺 GitHub](https://github.com/byronwai/lr-sidecar)。將 ARW（或者 Canon CR3）、XMP 同 ACR 拖入去，就可以喺 browser 睇每個 pass 點樣改張相。相片喺本機處理，唔會 upload 去 server。

最鍾意仍然係個 slice preview：將 edits 疊成一疊，逐層拆開睇。收埋個 stack 嘅時候，hover 或手指按住其中一層，可以拎到最面。亦可以 export 直式 Reel，用 **Behind the edit** 做預設標題，揀簡短嘅 Teaser 或顯示調整參數嘅 Tutorial。Reel 會挑選影響較大嘅步驟講，成品仍然包含所有啟用嘅 pass。

最近亦加返儲存咗嘅 crop / rotation 過場：平滑轉到最終構圖，之後張相保持定住。顏色方面改咗高光加色時嘅處理，減少飽和顏色令高光偏色。不過 compiler 目前用嘅係 RAW 內嵌嘅相機 JPEG，唔係重新 decode sensor data；套用 XMP 只係近似重建，唔會同 Lightroom 一模一樣。

補記（2026-11-21）：compiler 而家亦食 Canon CR3。用 track 1 嗰張 6000×4000 JPEG 做底，白平衡直接讀 CTMD 入面嘅 ColorData；distortion correction 係 Off 嘅話，AI mask 就唔做 warp。不過手上未有 CR3 連住 Lightroom XMP 同 ACR 嘅 export，所以 Canon 嘅 mask 對位未驗證到。

如果想 Reel 嘅成品畫面保留 Lightroom export 嘅顏色，可以**另外加一張已執好嘅 JPG**。呢張係 optional，只用喺封面同完成畫面；中間仍然保留 sidecar 重建嘅 slice walkthrough，唔會將成張 JPG 扮成逐層還原。

## 融合發動

![From cache to export and back]({{ site.baseurl }}/assets/images/lightroom/blog-lifecycle.png)

- 三個 file 要喺同一個 folder，用同一個 base name。Lightroom import 會自己識認的。
- RAW 正常情況唔會改的
- XMP 無咗又還原唔到，你不如重新執過
- ACR
  - 有：直接還原 AI Generated Raster mask
  - 冇：用 XMP 嘅 record 加自己嘅 AI model 重新計過，但係 AI Gen 就是 non-deterministic。試過 Lightroom corrupt 咗成個 mask 走位。

## Open Question

- `0x10` 嗰個 reserved u32 係用嚟做咩？
- 非 Sony 相機 (NEF, CR3, DNG) 嘅 ACR source tag 會係咩？CR3 個 container 已經拆咗，但未有連住 XMP 同 ACR 嘅 export
- Lightroom 肯唔肯 import 一個自己砌出嚟嘅 ACR？

如果你手上有其他牌子相機嘅 export，一個 hex dump 就可以幫手填多一格。Reader script 同所有圖嘅 generator 都喺 [lightroom-recovery](https://github.com/byronwai/lightroom-recovery) (`scripts/acr_reader.py`、`scripts/make_blog_figures.py`)。

## 後記

發現有 AI 之後，有好多當初無能力解釋嘅野都有個肯定的答案。就是世界去得太快，日日都好似中咗無量空處咁。

![無量空處]({{ site.baseurl }}/assets/images/lightroom/lr-afterword.png)

同時感謝 GLM 5.3 同 Claude Opus 5.5 幫手做拆解。無 LLM 的話我應該唔會諗住要填返之前 Lightroom Recovery 嗰啲坑吧。
