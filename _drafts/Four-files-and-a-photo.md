---
layout: post
title: "Four files and a photo: ARW, DNG, XMP and ACR inside Adobe"
slug: "Four-files-and-a-photo"
tags: [Photography, Lightroom, Reverse Engineering, File Format]
---

One photo I edited in Lightroom leaves the house as three files: a RAW for the pixels, an XMP for my decisions, and an ACR for the shapes those decisions computed. A fourth format, DNG, stands by as the container that could swallow all three. Three of these four are written up somewhere. The fourth, the `.acr` file, is documented nowhere I can find. Everything below about it comes from hex-editing my own exports. How I got the files back after losing access to the cloud library is a separate post; this is the companion piece, about what the files actually are, down to the byte.

## The mental model

Pixels, decisions, computed results. The RAW holds what the sensor saw. The XMP holds what I chose: sliders, crops, curves, written as text. The ACR holds what the engine computed from those choices and cannot cheaply compute again: one grayscale bitmap per AI selection, the molds the recipe pours into. And DNG is the container that can absorb all of it into one file.

![One photo, four formats: ARW, XMP, ACR, and DNG as the container]({{ site.baseurl }}/assets/images/lightroom/formats-hero.png)

| File | Role | Container | Written by | Read by | Publicly documented? | Where it lives in the LrCC cache |
|---|---|---|---|---|---|---|
| `.ARW` | the pixels | TIFF/EP dialect | your camera | any RAW converter | de facto, by reverse engineering | `originals\<year>\<date>\` |
| `.XMP` | the decisions | RDF/XML in an xpacket | Lightroom, Camera Raw, Bridge | the same, plus a text editor | yes, Adobe spec | `settings\<sha256>`, bare |
| `.ACR` | the computed result | private container of TIFF records | cloud Lightroom export only | Lightroom import | no | never cached; its payload sits in `auxiliary\` |
| `.DNG` | the absorber | TIFF per published spec | Adobe tools, some cameras | Adobe tools, open tools | yes, open spec | `proxies\2560\` (as stand-ins) |

One photo exported with settings travels as a trio: ARW, XMP, and, when masks are involved, ACR.

## TIFF in five minutes

Three of the four formats in this post are the same format underneath. Open a Sony RAW and the first four bytes are `49 49 2A 00`: `II*\0`, little-endian TIFF. Skip the 16-byte signature at the start of any record inside an ACR and you find the same four bytes. A DNG starts the same way, or with `4D 4D 00 2A` (`MM\0*`), since the spec allows either byte order. TIFF dates from 1986; the revision everyone implements, TIFF 6.0, is from 1992. So TIFF first, once.

TIFF reads nothing like a modern format. PNG is a stream: chunk, length, chunk, length, top to bottom. TIFF is a pointer chase. The header is eight bytes: magic, then one offset. You jump there and find an IFD, an image file directory, which is a table of 12-byte entries. Each entry is four fields:

![The 12-byte TIFF IFD entry: tag, type, count, value or offset]({{ site.baseurl }}/assets/images/lightroom/formats-ifd-entry.png)

That last field is the whole trick. `ImageWidth = 6000` fits inline, four bytes, done. A list of a hundred strip offsets does not, so the entry points elsewhere and you jump again. The table ends with one more offset: the next IFD, or zero. Data lives wherever pointers put it, usually one level deeper than you expect.

## ARW: the pixels

Sony did not invent a container. Canon's CR2, Nikon's NEF, Olympus ORF and Pentax PEF are all TIFF/EP dialects too, private tags bolted onto the 1990s electronic-photography profile. The exceptions are recent or stubborn: Canon's current CR3 is built from MP4-style boxes, and Fuji's RAF wraps its data in a container of its own.

Here is the map of a real file, DSC00001.ARW, 38,268,928 bytes, every offset parsed by hand:

```
 II*\0 + IFD0          @ 0x000008   20 entries
 ├─ 0x8769  ExifIFD    @ 0x0011CC   45 entries (dates, lens, exposure)
 │   └─ 0x927C MakerNotes @ 0x001472   38,252 B, Sony private zone
 ├─ 0x014A  SubIFD     @ 0x021D22   40 entries
 │   └─ 0x0111 StripOffsets -> 0x1EA000   sensor strip, 7168x5120, 36,259,568 B
 ├─ 0x0201  JPEGInterchangeFormat -> 0x0300A2   preview JPEG, 177,176 B
 └─ (nextIFD) IFD1     @ 0x00AABC   14 entries, thumbnail JPEG @ 0x00ABCE, 8,130 B
     └─ (nextIFD) IFD2 @ 0x021BEE   16 entries
         └─ 0x0201 -> 0x05C000   full-size JPEG, 7008x4672, 1,629,784 B
 EOF 0x247F000
```

Follow the next-IFD chain and the biggest surprise appears. IFD0's own 0x0201 tag points at a 177 KB preview, not the frame. The full-size rendering, 7008x4672 and 1.6 MB, hangs off **IFD2**, a third directory chained behind the thumbnail's IFD1, under the same tag number. Its 7008x4672 is slightly smaller than the 7168x5120 sensor strip because the strip includes masked border pixels the JPEG crops away. Read IFD0 alone and you will conclude the camera embeds a small preview; walk the chain and you find the whole frame.

Two things to notice. First, 36 of the 38 megabytes are the sensor strip, and it hides in a SubIFD one jump below IFD0, behind a tag whose name does not mention pixels. Second, MakerNotes is 38 KB of Sony-private territory that the EXIF standard explicitly leaves to the vendor. That is where white-balance matrices and lens corrections live, and it is why every RAW decoder carries vendor-specific code.

The embedded JPEGs deserve their own paragraph. The file contains 144 JPEG start markers: the 8 KB thumbnail in IFD1, the 177 KB preview in IFD0, the 1.6 MB full frame in IFD2, and many smaller JPEG streams inside other structures. The camera needs to show you something on its screen, and every brand embeds previews like this. Do not trust IFD0's 0x0201 to hand you the big one: walk the chain, or scan for it.

> **Recovery note.** When I had thousands of edited renders with every byte of metadata stripped and no table left to match them to photos, correlating them against these embedded JPEGs was the way back. A byte scan for `FFD8FF` to `FFD9`, keep the largest span, compare. Keeping the largest span is what makes it work: it skips IFD0's preview and lands on IFD2's full frame.

One quirk if you ever parse ARW yourself: version 2.3.1 has a strip-data offset that is off by one, and every decoder carries a `+1` hack for it.

![ARW structure: DSC00001.ARW pointer chase with a to-scale size bar]({{ site.baseurl }}/assets/images/lightroom/arw-structure.png)

## XMP: the decisions

An XMP file is XML you can read in any text editor. Three layers:

```
 <?xpacket begin id="W5M0MpCehiHzreSzNTczkc9d"?>      <- packet, fixed GUID
 <x:xmpmeta xmlns:x="adobe:ns:meta/">                  <- wrapper + toolkit
  <rdf:RDF>
   <rdf:Description xmlns:crs=".../camera-raw-settings/1.0/"
     crs:Exposure2012="0.00"   crs:Temperature="5200"  crs:Tint="+13"
     crs:Vibrance="+15"        crs:Saturation="+5"    ... (108-139 attributes, median 115)
     <crs:ToneCurvePV2012><rdf:Seq><rdf:li>0, 0</rdf:li>...</rdf:Seq>
     <crs:MaskGroupBasedCorrections>                   <- one per mask group
      <rdf:li><rdf:Description crs:What="Correction"
        crs:CorrectionName="Mask 1" crs:CorrectionSyncID="5F52C0B2...">
        <crs:CorrectionMasks>
         <rdf:li crs:What="Mask/Gradient"
           crs:ZeroX="0.432283" crs:ZeroY="1.6277"     <- the whole gradient:
           crs:FullX="0.432382" crs:FullY="1.342686"/> <- four floats
        </crs:CorrectionMasks></rdf:Description></rdf:li>
    ...
```

Sliders are attributes, one line each: your exposure is `crs:Exposure2012="0.00"`, white balance a pair like `crs:Temperature="5200"` and `crs:Tint="+13"`. Curves do not fit in an attribute, so they become child elements holding an `rdf:Seq` of points, literally `0, 0` and `255, 255` for an untouched curve. A mask is a nested `rdf:Description` with its own name, its own sync ID, its own geometry, and for range masks its own luminance curve. An edit within the edit.

That nesting is also why the file grows. Across the 2,648 edit blobs in my cache, the smallest is 4,912 bytes and the largest 119,650, with a median of 19,408. The top-level `rdf:Description` alone carries between 108 and 139 attributes.

Notice what the gradient entry above does not contain: pixels. A gradient is four floats. A radial is a box, an angle and a feather. A brush stroke (`Mask/Paint`) is a radius, a flow and its points. An AI selection is different. A `Mask/Image` entry carries `MaskSubType`, `ModelVersion`, `InputDigest`, `FullMaskSize`, `Origin`, `ReferencePoint`, `WholeImageArea` and, once the mask has been computed, a 32-hex-character `MaskDigest` (present on 9,312 + 2,103 of 16,800 AI-mask entries in my cache). Every other mask type is a recipe the engine can re-run exactly. An AI mask is the output of a model, and the XMP only points at it. Hold that thought for the ACR section.

Two facts about XMP mattered more than anything else during the recovery. The first is the naming rule: Camera Raw reads a sidecar only if its base name is byte-identical to the photo's. `DSC02091.xmp` beside `DSC02091.ARW` works. `2024-11-16_DSC02091.xmp` does nothing, silently, with no warning anywhere. Adobe's own documentation for what it calls XMP/ACR files states the mechanism; nothing states the silence.

The second: the same payload wears three envelopes, depending on where it lives:

![One XMP payload in four envelopes]({{ site.baseurl }}/assets/images/lightroom/formats-xmp-envelopes.png)

Same meaning, three containers, and a surprise in the last row. I had assumed the export adds the packet wrapper. It does not: all 83 sidecars written by Lightroom's export in my second folder start directly at `<x:xmpmeta`, exactly like the store. The wrapper only appears in the sidecars my recovery pipeline wrote. So for Adobe's own tools the transformation is even smaller than I thought: copy the bare blob and give it the right name. The wrapper is for other XMP readers. The most important function in the recovery pipeline is still the one that refuses to do anything cleverer than that.

The store names each bare blob by the sha256 of its contents, which I verified computationally: it holds for every file Adobe has not rewritten in place. The catalog stores no path to an edit, only a hash; the file system is the index.

## ACR: the computed result

This is the part nobody has written up. An `.acr` file appears when you export a photo as "original plus settings" from cloud Lightroom. Adobe's formats page does not mention it, the export dialog does not mention it, and the first mention anywhere in the pipeline is the file itself, sitting next to your RAW with the same base name.

### When an ACR is written, and when it is not

My original export set: 352 photos and 350 ACR files, and the two photos without one had no masks. A second export folder, measured for this post, makes the rule sharper. It holds 83 export sidecars and 76 ACRs:

- 76 sidecars contain at least one AI mask (`Mask/Image`). All 76 have an ACR.
- 7 sidecars contain no AI mask. None has an ACR.

(The same folder also holds 521 XMPs written by my recovery pipeline. None of them has an ACR, because only Lightroom's export writes one. I left them out of the count.)

So, on 83 of 83: **an ACR exists if and only if the edit contains an AI mask.** Remove-tool patches ride along when present (two of the 76 have them), but I have no export with Remove spots and no AI mask, and no export masked only with gradients.

![The export writes an .acr exactly when the XMP has an AI mask]({{ site.baseurl }}/assets/images/lightroom/formats-acr-presence.png)

### The whole-file byte map

A header, a table with one entry per record, then the records. Here is DSC02091.acr, 215,820 bytes, 4 records:

```
 +0x00000   header, 20 bytes          magic, version, source format, record count, reserved
 +0x00014   record table, 4 x 32 B    md5 | size | offset, one entry per record
 +0x00094   record 0   54,998 B       1972x1920 mask
 +0x0D76A   (2 bytes zero padding)
 +0x0D76C   record 1   55,400 B       2880x1920 mask, full frame
 +0x1AFD4   record 2   41,452 B       2117x1742 mask
 +0x251C0   record 3   63,820 B       1449x1743 mask
 +0x34B0C   EOF
```

![DSC02091.acr byte map: header, record table, records]({{ site.baseurl }}/assets/images/lightroom/acr-structure.png)

Each record is a 16-byte signature followed by a self-contained TIFF, and each starts on a 4-byte boundary. When a record's length is not a multiple of 4, two zero bytes of padding follow it, and the file as a whole is padded the same way. The table gives every record's exact size and offset, so nothing has to be found by scanning. In all 76 files, each table entry lands exactly on a record signature, the records and padding tile the file with no gaps, and the last tile of every TIFF ends 0 or 1 byte before the record does.

### The header, field by field

Measured on all 76 files. Every field is now accounted for:

| offset | size | type (LE) | observed | meaning | confidence |
|---|---|---|---|---|---|
| 0x00 | 4 | char[4] | `41 43 52 00` "ACR\0" | magic | Confirmed, 76/76 |
| 0x04 | 4 | u32 | 1 | format version | 1 in 76/76; meaning assumed |
| 0x08 | 4 | char[4] | `41 52 57 00` "ARW\0" | source RAW format | 76/76 ARW |
| 0x0C | 4 | u32 | 3, 4, 7, 8 | **record count N** | Confirmed, 76/76 |
| 0x10 | 4 | u32 | 0 | reserved | 0 in 76/76; purpose unknown |
| 0x14 | 32 × N | entry[N] | | **record table** | Confirmed, 300/300 entries |

Each 32-byte table entry:

| offset in entry | size | type | meaning |
|---|---|---|---|
| +0x00 | 16 | bytes | MD5 of the record (signature + TIFF, without padding) |
| +0x10 | 8 | u64 | record size in bytes |
| +0x18 | 8 | u64 | record offset from the start of the file |

So the first record starts at 20 + 32 × N: 0x94 (148) for a four-record file, but 0x74 for three records and 0x114 for eight. The "148-byte header" in my earlier notes was a four-record coincidence.

The real bytes, the first 0xB0 of DSC02091.acr:

```
          00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f
00000000: 41 43 52 00 01 00 00 00 41 52 57 00 04 00 00 00   magic "ACR\0" | version 1 | "ARW\0" | N = 4
00000010: 00 00 00 00 1e 15 d6 45 44 97 ff 82 d2 c5 f2 de   reserved 0 | entry 0: md5...
00000020: b2 7c 90 e0 d6 d6 00 00 00 00 00 00 94 00 00 00  ... md5 | size 54,998 (u64) | offset 0x94...
00000030: 00 00 00 00 6d 81 5a 60 27 76 8e 96 a9 85 e8 74  ... | entry 1: md5...
00000040: bb d7 1a 8f 68 d8 00 00 00 00 00 00 6c d7 00 00  ... md5 | size 55,400 | offset 0xD76C...
00000050: 00 00 00 00 d6 0e 28 ec 67 62 04 31 bb 77 37 5b  ... | entry 2: md5...
00000060: 7d 28 98 f0 ec a1 00 00 00 00 00 00 d4 af 01 00  ... md5 | size 41,452 | offset 0x1AFD4...
00000070: 00 00 00 00 de e3 58 69 ce f3 d2 76 6a d8 8e 16  ... | entry 3: md5...
00000080: 57 6f 18 32 4c f9 00 00 00 00 00 00 c0 51 02 00  ... md5 | size 63,820 | offset 0x251C0...
00000090: 00 00 00 00 02 00 00 00 01 00 00 00 00 00 00 00  ... | record 0 signature @ 0x94
000000a0: 00 00 00 00 49 49 2a 00 08 00 00 00 0c 00 fe 00  ... | II*\0, IFD @ 8, 12 entries, tag 0x00FE
```

This also explains what earlier notes called a "20-byte identifier that is not a SHA-1". Those 20 bytes at 0x14 are entry 0's MD5 plus the low four bytes of its size. In DSC09053 the "suspicious" `9a 73 01 00` was the size, 95,130 bytes, of a record that occupies 95,132 bytes with its padding. No hash was ever going to match it.

### The record signature

Every record starts with the same 16 bytes:

```
 02 00 00 00  01 00 00 00  00 00 00 00  00 00 00 00   then II*\0
```

All 300 records in the 76 ACRs carry it, and so do all 4,504 type-02 files in the local `auxiliary\` cache. Because the table gives every record's offset, this is now a real observation, not an artifact of scanning for the pattern. The export container did not invent a record format; it inherited the cache's. The cache also holds type-05 records (`05 00 00 00 02 00 00 00` plus a field, 198 files). None appears in any ACR.

### The inner TIFF

Strip the 16-byte signature and each record is a plain little-endian TIFF. Across all 4,504 cached records and all 300 ACR records, the structure never varies: one IFD, always the same twelve tags.

| tag | values seen | meaning |
|---|---|---|
| 0x00FE | 0 | NewSubfileType: a main image |
| 0x0100 / 0x0101 | 109 to 7038 / 64 to 4686 | width / height of this raster |
| 0x0102 | 8, or 16,16,16 | bits per sample |
| 0x0103 | 52546, always | compression, see below |
| 0x0106 | 1 or 2 | photometric: 1 = BlackIsZero (a mask), 2 = RGB (a patch, see below) |
| 0x0115 | 1 or 3 | samples per pixel |
| 0x011C | 1 | planar configuration: chunky |
| 0x0142 / 0x0143 | e.g. 1440 x 1920, 768 x 768 | tile width / length |
| 0x0144 / 0x0145 | 1 to 24 entries | tile offsets / byte counts, one per tile |

Two things a TIFF purist would flag, both measured. First, the tile count always matches the geometry: a 2880x1920 mask is two 1440x1920 tiles, and a small mask is a single tile exactly the size of the image. Second, Adobe ignores TIFF 6.0's rule that tile dimensions be multiples of 16. Only 1,300 of 4,504 rasters satisfy it; single-tile rasters simply use the image size, odd numbers included. JPEG-XL tiles do not need the alignment, and the writer does not pretend otherwise.

Compression 52546 is the interesting one. `tifffile` names the enum `JPEGXL_DNG`: JPEG-XL, the compression DNG 1.7 adopted. That is why ordinary tools fail. Pillow refuses the file at open, "cannot identify image file", because it does not know the codec. `tifffile` plus `imagecodecs` decodes it, and out comes a numpy array you can save as a PNG and look at: a gray silhouette of whatever was selected.

**Rasters are cropped to their mask.** There are 3,106 distinct raster sizes in the cache, from slivers 64 pixels high to the full 2880x1920 frame and beyond. Each raster covers only the mask's bounding box. The placement lives in the XMP, on the AI-mask entry itself. `FullMaskSize` gives the canvas, normally the photo scaled to a 2880-pixel long edge (2880,1920 for 8,474 masks; 2880,1918 for 700; 2560,1707 for 138). `Origin` gives the raster's top-left corner on that canvas. A 2237x673 subject mask, for instance, sits at Origin 56,605. For all 9,312 AI masks whose raster is cached, Origin plus raster size lands inside FullMaskSize, without exception. So an ACR record does not need to say where its pixels go: the XMP already does.

The crop depends on what was selected. Subject masks are almost never full-frame (4 of 3,275); scene masks such as sky, background and water often are (2,924 of 5,801), because the sky usually touches the edges.

**Not every raster is a mask.** 65 of the cached records are 3-channel, 16-bit RGB (photometric 2). None is referenced by a MaskDigest. 58 of them are referenced from `crs:RetouchAreas` instead, by `crs:pm_patch` and `crs:pm_patch_variation` attributes on spots of `crs:SpotType="heal_patchmatch"`: the Remove tool's patches. These are the actual replacement pixels the Remove tool computed, stored beside the masks in the same container format. They travel in the ACR too. The two exported photos with Remove spots have ACRs of 7 and 8 records, of which 3 each are these RGB patches.

Here is what one of them looks like taken apart. Every record of DSC02110.acr is decoded and labelled from the sibling XMP by matching MD5s:

![DSC02110.acr decomposed: four AI masks and three Remove-tool patches]({{ site.baseurl }}/assets/images/lightroom/acr-decomposed.png)

Three things are visible at a glance:
- Background (record 0) is the exact inverse of Subject, and it is still stored as a separate full-frame raster.
- The two Subject records (4 and 6) belong to two different mask groups. They have the same size and Origin but different MD5s, so each group keeps its own copy.
- The three 538x538 RGB tiles are not masks at all. They are the pixels the Remove tool painted in, frozen so that the result does not depend on re-running the patch search.

*(Generated by `scripts/make_acr_decomposed_image.py`. Run without `--no-photo` it also outlines each mask on the photo itself, at its XMP `Origin`. That version of this figure shows identifiable people, so it is not published here.)*

### How a raster binds to its mask

This was the key open question. The XMP says "this mask is a Select Subject". The ACR says "here is a grayscale bitmap". What ties bitmap number three to mask number three?

In the cache, the answer is clean and fully measured: **content addressing**. Every AI-mask entry carries `crs:MaskDigest`, 32 hex characters. That value is the **MD5 of the raster record**, all of it, the 16-byte signature plus the TIFF. The cache file is named by that same MD5 (`auxiliary\<first 3 hex>\<remaining 29>`). The numbers:

- 4,504 of 4,504 type-02 cache files are named by the MD5 of their own bytes.
- 4,410 of the 5,162 distinct MaskDigest values in my 2,648 edit blobs name a raster that is on disk. The rest point at rasters this machine never downloaded, or has already purged.
- Remove-tool patches use the same scheme, through `crs:pm_patch` / `crs:pm_patch_variation`.
- No other `*Digest` attribute in the XMP (InputDigest, GroupDigest and seven more) names a raster.

So the binding needs no record order. A reader takes a mask's MaskDigest and looks for the record whose MD5 matches.

The ACR confirms it. For all 300 records in the 76 files, the MD5 of the record equals its table entry's MD5. That MD5 is a `MaskDigest` (or `pm_patch` / `pm_patch_variation`) in the sibling XMP. And the XMP references no raster that its ACR lacks. It is an exact one-to-one match. The table order does not follow the XMP: it differs in 74 of 76 files. So order was never the binding, and neither were the sync IDs. And 106 of the 300 ACR records also sit in my local cache under the same MD5, byte for byte: the export copies cache records into the container unchanged.

![MaskDigest in the XMP equals the md5 of the ACR record; Origin places the raster]({{ site.baseurl }}/assets/images/lightroom/formats-mask-binding.png)

### The experiment matrix

Measured on the cache's 2,648 edit blobs (including older revisions), counting every mask entry:

| mask type (`crs:What`) | entries | raster? | what the XMP stores instead |
|---|---|---|---|
| Mask/Gradient (linear) | 2,932 | never | ZeroX/Y, FullX/Y: four floats |
| Mask/CircularGradient (radial) | 167 | never | box, angle, feather, roundness |
| Mask/Paint (brush) | 67 | never | radius, flow, center weight and the stroke |
| Mask/Ellipse | 6 | never | center, size, alpha |
| Mask/RangeMask | 9 | never | the range parameters |
| Mask/Aggregate | 1 | never | a container for other masks |
| Mask/Image, MaskSubType 1 (Subject: "Subject #", "主體 #") | 5,113 | 1-channel 8-bit, cropped | MaskDigest, Origin, FullMaskSize, ModelVersion |
| Mask/Image, MaskSubType 0 (scene categories, `MaskSubCategoryID` 22 Background, 50006 Sky, 50007 Water, 11 Clothes) | 11,419 | 1-channel 8-bit, often full-frame | same |
| Mask/Image, MaskSubType 3 (people parts, "All People - Clothes") | 268 | 1-channel 8-bit, cropped | same |
| Remove tool (`RetouchAreas`, `heal_patchmatch`) | 60 spots | 3-channel 16-bit RGB patches | pm_patch / pm_patch_variation digests, target/search rectangles |
| Generative Remove | 0 seen | — | not present in this cache |

My first description of the ACR was "the frozen shape of any AI or complex masks". It turns out to be exact on the first half and wrong on the second. Complex is not enough: a long brush stroke is still a recipe. Only model output is frozen: AI masks and Remove patches.

### ACR before it exists

The local cache holds the pre-export form. `auxiliary\` contains 4,734 files: 4,504 type-02 raster records (the same 16-byte signature plus TIFF, each named by its own MD5), 198 type-05, 31 zlib-compressed XMP payloads, one stray JPEG. The cache index (`purgeCandidates`, binaryType `aux`) carries both each raster's digest and the photo's asset ID, which is why attribution needs no other table. And as above, the XMP's MaskDigest values reach the same files without the index at all. My assembler run against the cache: 4,504 rasters, 4,448 attributed across 1,219 photos, 56 orphan digests, every attributed raster decoded. So "recovering the ACR" offline really means re-assembly. The payload is all there, and the records are byte-identical to what an ACR carries. The container is an export-time artifact, and with the header decoded it can now be synthesized. Write the 20-byte header with N. Write one table entry per raster the XMP references: its MD5, size and offset. Then write the records on 4-byte boundaries. The only guesses left are the version and the reserved field, and every file I have sets them to 1 and 0.

### Open questions

1. What the reserved u32 at 0x10 is for, and whether version 1 ever changes.
2. The source-format tag for non-Sony exports: NEF, CR3, DNG, JPEG.
3. Does an edit with only Remove spots, or only gradients and brushes, produce an ACR?
4. Every ACR I have contains exactly one full-frame (2880x1920) raster, 76 of 76. Is that a coincidence of my editing habits (one Sky or Background mask per photo), or does the export always include one?
5. Does Lightroom import a synthesized ACR, and does Camera Raw or Bridge read `.acr` files at all?
6. Whether the DNG 1.7 JPEG-XL tiles in ACR records are spec-identical to DNG's own JXL coding, which would make each record a tiny DNG-adjacent object.

If you can run any of these, the reader script below gives you the harness. Numbers welcome; I will fold them in and credit them.

### A machine-readable spec

With the record table decoded, the whole format fits in a short Kaitai Struct spec. Each table entry fetches its record by offset and size:

```yaml
meta:
  id: adobe_acr
  title: Adobe Lightroom.acr mask-raster container (reverse-engineered)
  file-extension: acr
  endian: le
  encoding: ASCII
doc: >
  Written by cloud Lightroom's "original + settings" export when the edit
  contains AI masks. Records are 4-byte aligned; padding is zero.
seq:
  - id: magic
    contents: ["ACR", 0]
  - id: version
    type: u4
    doc: 1 in every observed file
  - id: source_format
    type: strz
    size: 4
    doc: '"ARW" observed'
  - id: num_records
    type: u4
  - id: reserved
    type: u4
    doc: 0 in every observed file
  - id: entries
    type: entry
    repeat: expr
    repeat-expr: num_records
types:
  entry:
    seq:
      - id: md5
        size: 16
        doc: md5 of the record; equals crs:MaskDigest or crs:pm_patch* in the XMP
      - id: len_record
        type: u8
      - id: ofs_record
        type: u8
    instances:
      record:
        io: _root._io
        pos: ofs_record
        size: len_record
        type: record
  record:
    seq:
      - id: signature
        contents: [2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      - id: tiff
        size-eos: true
        doc: little-endian TIFF, one IFD, 12 tags, compression 52546 (JPEG-XL)
```

## DNG: the container that swallows the trio

DNG is TIFF/EP too, but published: a real specification, updated in the open, free to implement, released 2004. Adobe's problem was that every new camera shipped a new RAW variant and Adobe reverse-engineered support on someone else's schedule. DNG was the fix: one documented container, mandated tags instead of private ones.

It is a well designed format, which is the frustrating part of its story. Beyond standardization it adds fast-load previews, a medium JPEG near the start of the file so the app renders in milliseconds instead of decoding 40 MB; an MD5 checksum tag, so you can prove a RAW has not rotted; a lossy mode at roughly a third the size; and a linear mode storing demosaiced RGB, which sounds like heresy until you learn Apple ProRAW is exactly that.

Here is the part nobody puts on the label: Adobe uses DNG everywhere internally. Lightroom's smart previews are lossy DNGs. The cloud cache's proxy files, the 2560-pixel stand-ins keyed by asset ID, are DNGs. Camera Raw's central cache stores DNGs. Told as a camera format, DNG's adoption story is a failure, since Sony, Nikon and Canon never shipped it natively, RAW being useful lock-in. Told as Adobe's internal currency, DNG won completely.

And DNG swallows the XMP whole: edit metadata goes into the same file, no sidecar, no naming rule. One file per photo, pixels plus every decision. Which raises the question this post cannot answer: can a DNG carry what an ACR carries? The building blocks exist on paper, DNG 1.7 even adopted the same JPEG-XL compression the ACR tiles use, but whether any writer packs mask rasters into a DNG, and whether any reader would honor them, is unknown. Open question, listed with the others.

## Putting it back together

The whole system in one picture: the cache on one side, the trio on disk on the other.

![From cache to export to re-import]({{ site.baseurl }}/assets/images/lightroom/formats-lifecycle.png)

The binding rules for the trio, condensed: same folder; byte-identical base name; one XMP per photo; newest revision wins when several hashes map to one photo (the catalog's `dateLastUpdatedInSeconds` is the tiebreaker); and the ACR takes the same base name. Without an ACR, the engine recomputes the masks from the XMP parameters plus its own built-in AI models: close, occasionally not identical. Nothing is rewritten. The RAW never gains a byte; the XMP is placed beside it.

![Lightroom cloud local data layout]({{ site.baseurl }}/assets/images/lightroom/lightroom-cc-layout.png)

<!-- TODO: merge diagram (only on Notion so far); export it to assets and embed here -->

> **Recovery, condensed.** The recovery itself is a separate post. In short: everything above lives unencrypted under `%LOCALAPPDATA%\Adobe\Lightroom CC\Data\<guid>\`. It is indexed by a SQLite database (`Managed Catalog.wfindex`) next to a CBOR document store (`Managed Catalog.mcat`). One table, `purgeCandidates`, maps photo to blob to on-disk flag, and an eight-step pipeline turns the cache back into the trio plus reassembled rasters (4,504 rasters, 4,448 attributed, 56 orphans). Two things stay cloud-only. One is the blobs the index says were never downloaded. The other is the pixels Generative Remove invented: those live on Adobe's servers, and all the local cache holds is request and response receipts, not settings. (The ordinary Remove tool is different: its patches are cached locally as RGB rasters, as the ACR section shows.) After a cancellation, the web grace period or a trial is the only door to those.

## Closing

What is now known about ACR: all of it that matters. It appears exactly when an edit contains AI masks. It is a 20-byte header, a table of MD5, size and offset per record, then 4-byte-aligned records. Each record is the same signature-plus-TIFF that the local cache stores under the same MD5, cropped to its mask, JPEG-XL inside, Pillow-hostile and tifffile-friendly. The XMP finds each one by that MD5 and places it with `Origin` on a `FullMaskSize` canvas. What is not known: a reserved u32, the tag for non-Sony sources, and whether Lightroom accepts an ACR it did not write. The reader script is `scripts/acr_reader.py` in the repo, one command, dumps records and decodes rasters; the spec is above. If you have an export from another camera brand, one hex dump closes the next gap.

<!--
Author notes, not rendered. Open items lifted from the review draft (glm-refine-output.md):
- VERIFY: prior art search, see part 4  <- "...he fourth, the `.acr` file, is documented nowhere I can find"
- VERIFY: Camera Raw too?  <- "...IFF records | cloud Lightroom export only | Lightroom import"
- VERIFY: cite both dates  <- "...86; the revision everyone implements, TIFF 6.0, is from 1992"
- VERIFY: the draft says both "Fuji's older files are TIFF dialects" and "RAF does not use TIFF at all"; reconcile against the RAF layout  <- "...xes, and Fuji's RAF wraps its data in a container of its own"
- VERIFY: exact versions affected; known third-party decoder workaround  <- "...lf: version 2.3.1 has a strip-data offset that is off by one"
- VERIFY: GLM's export-set figures, 9,028 B for a zero-mask edit and 26,889 B for six mask groups, are not in the repo; the repo's `docs/diagrams.md` says "~1.7 KB", which these numbers rule out for a full develop blob.  <- "...f:Description` alone carries between 108 and 139 attributes."
- VERIFY: which readers reject a bare sidecar?  <- "...give it the right name. The wrapper is for other XMP readers"
- VERIFY: prior-art search date and terms, part 4  <- "...: the computed result This is the part nobody has written up"
- VERIFY: the Notion draft says both had an XMP with zero masks; GLM's census says one had no XMP at all  <- "...d 350 ACR files, and the two photos without one had no masks"
- NEEDS DATA: export one of each to confirm that neither produces an ACR on its own  <- "...ots and no AI mask, and no export masked only with gradients"
- NEEDS DATA: NEF/CR3/DNG/JPEG exports  <- "...r[4] | `41 52 57 00` "ARW\0" | source RAW format | 76/76 ARW"
- VERIFY: (check)  <- "...nt 2" for it does not fit that pattern and should be re-read"
- VERIFY: DNG 1.7 spec section number  <- "... enum `JPEGXL_DNG`: JPEG-XL, the compression DNG 1.7 adopted"
- NEEDS DATA: does Lightroom import a synthesized ACR? That is the real test  <- "...e reserved field, and every file I have sets them to 1 and 0"
- VERIFY: fresh export, place trio, open in ACR-hosting Photoshop  <- "... ACR, and does Camera Raw or Bridge read `.acr` files at all"
- VERIFY: year and current spec version  <- "...ation, updated in the open, free to implement, released 2004"
- VERIFY: (check)  <- "...nds like heresy until you learn Apple ProRAW is exactly that"
- VERIFY: spec mapping  <- "... even adopted the same JPEG-XL compression the ACR tiles use"
- NEEDS DATA: convert one masked ARW+XMP trio to DNG, export settings, inspect for raster subIFDs  <- "...o a DNG, and whether any reader would honor them, is unknown"
-->
