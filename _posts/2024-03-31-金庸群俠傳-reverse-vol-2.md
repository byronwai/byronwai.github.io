---
layout: post
title: "金庸群俠傳 reverse vol 2"
date: 2024-03-31 12:00:00 +0000
slug: "金庸群俠傳-reverse-vol-2"
tags: [Reverse Engineering]
---
根據我[理解](https://stackoverflow.com/questions/5095546/what-is-the-relationship-between-flex-flash-and-actionscript-3-0)[^1]，SWF 自身只是一個 Media File, 記錄當中不同物件的活動。 SWF header 中包含所需 Flash Version, resolution (framesize), framerate 等等資料，可以用 HexEditor 直接閲讀。我這裏直接借用 OWASP China 2012 演講 - [基于文件格式的Adobe Flash漏洞挖掘框架](http://www.owasp.org.cn/OWASP-CHINA/OWASP_Events/download/Exploiting_Adobe_Flash_zh.pdf)[^2] 中作補充。

![image4]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-2/image4.png)

## SWF File

SWF file 使用 tag 作儲存 (e.g. DefineShape, DefineSound), 若其中有一個 tag 損毀，SWF player 亦可以跳過整個 tag 並閲讀下一個 start of tag。

![image3]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-2/image3.png)

介紹過 tag 概念後，SWF 其中一項特點是會包含 DoABC tag，DoABC 當中會包含 ActionScript (AS3)代碼， 容許 SWF 文件可以擁有 interation and logic flow。基本上 flash 遊戲的骨架是基於 ActionScript。我在一開始打算 Reverse Flash Game 時就使用錯誤的 keyword，並認爲整個需要逆向整個 SWF 文件。這樣做模擬無異於 reverse 整個 mp4 文件般不合理。遊戲交互與邏輯部分由 SWF 當中的 ActionScript 負責，集中看 DoABC Tag 中的 ActionScript 即可。

由 [SWF FILE FORMAT SPECIFICATION](https://open-flash.github.io/mirrors/swf-spec-19.pdf)[^3] P.117可見，ABCData (in .abc format) 包含在 DoABC Tag 當中。

---

## AS3 and AVM2

在 CSK 的 [AVM2虚拟机浅析与AS3性能优化](https://www.csksoft.net/data/avm2_as3_intro_shikai_chen.pdf)[^4] 一文中可以知道 SWF 文件只是一個 media file，需要 Flash Player 才可播放。而 Flash Player 包含 Action Script VM (AVM)，用於執行 ActionScript Bytecode。我們一般所說的 Flash Game 都依賴 AVM2 執行，亦即使用 Flash Player 9 或之後。 如果你第一次聽說 VM 概念，可以想象成 Java 執行時候需要 JVM 包含 interpreter / JIT engine，確保 Java code 可順利執行，亦可確保 memory safe 不影響 host。

註：我在 reveiew 本文時才發現 CSK 也有做過類似 Online Riddle 的網頁遊戲...

![image2]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-2/image2.png)

ActionScript 爲一款 interpret language，撰寫後不必 compile，但要依賴 runtime 的 interpreter 順利執行。AVM 同時擁有 interpreter 與 JIT (Just-in-time) engine，超過 threshold 後才使用 JIT engine 加速。如果你對 JIT 有興趣，不妨找 wwkenwong 查詢，他稍早時間在做 JavaScript JIT 相關的研究。

至於 ActionScript 是如何轉換爲 ByteCode，可以參考 [Inside AVM](https://recon.cx/2012/schedule/attachments/43_Inside_AVM_REcon2012.pdf)[^5]。 該文同時有說明 AVM implememtation 及如何在 AVM 中作 memory fuzzing。

![image1]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-2/image1.png)

## 預告

下期我們會以 Static Analysis 方法，拆解金庸群俠傳中的代碼。

[^1]: <https://stackoverflow.com/questions/5095546/what-is-the-relationship-between-flex-flash-and-actionscript-3-0>

[^2]: <http://www.owasp.org.cn/OWASP-CHINA/OWASP_Events/download/Exploiting_Adobe_Flash_zh.pdf>

[^3]: <https://open-flash.github.io/mirrors/swf-spec-19.pdf>

[^4]: <https://www.csksoft.net/data/avm2_as3_intro_shikai_chen.pdf>

[^5]: https://recon.cx/2012/schedule/attachments/43_Inside_AVM_REcon2012.pdf
