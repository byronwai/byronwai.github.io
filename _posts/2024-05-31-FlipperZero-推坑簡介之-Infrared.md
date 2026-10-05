---
layout: post
title: "FlipperZero 推坑簡介之 Infrared"
date: 2024-05-31 12:00:00 +0000
slug: "FlipperZero-推坑簡介之-Infrared"
tags: [FlipperZero, Infrared]
---
係 Flipper Zero 嘅紅外線 Infrared (IR) module 入面，包含住一組 IR 接收器同三粒 IR LED。令 Flipper Zero 具備發射同接收 IR signal 嘅能力。係云云咁多 functions 入面可以話係最容易 implement 同使用，但亦係日常生活中使用機會最多嘅一樣。

### 讀取 IR signal

坊間一般遙控器都係以發射 IR 去控制電子產品，例如電視遙控咁。當然宜家有啲電視已經轉用 Bluetooth (e.g. 小米電視)，就無得讀取佢嘅遙控 IR 信號。

我地先利用 Flipper Zero 去讀取遙控器嘅 IR signal，選擇 “Learn New Remote”，之後就開始用 remote 對準 Flipper Zero，撳遙控器其中一個制發出信號。

![image19]({{ site.baseurl }}/assets/images/flipperzero-infrared/image19.png)

當錄低咗 IR Signal 之後，Flipper Zero 會問你要唔 Save 低個 Command，可以之後 Reply。當有同一個遙控器嘅其他制要記錄，用下面嘅加號再重複以上動作即可。

### IR signal Protocol

係一個 valid 嘅 IR signal 入面，必然會包含：

  - Address (e.g. Device Type)
  - Command (e.g. On/Off, Volume Up/Down)

以頭先嘅 NowTV 遙控爲例，開關嘅 IR Signal Address 爲 0x5040，Command 則爲 0xF50A。係 NEC Infrared Transmission Protocol[^1] (NECext) 入面我哋可以見到 signal 嘅結構。我地可以觀察到 Address 同 Command 都一定係 8 bit，而且傳輸一組之後會即刻接住該 8 bit 嘅 inverse，就好似 F♯ 同 G♭ 嘅關係咁。

![image16]({{ site.baseurl }}/assets/images/flipperzero-infrared/image16.png)

出處：<https://techdocs.altium.com/display/FPGA/NEC+Infrared+Transmission+Protocol>

註：作者係寫文嘅時候用咗 10 秒諗點解 NECext 嘅 signal 一定係 67.5ms，證明佢嘅 PON 都唔係一時三刻...

除咗 NEC 之外，坊間唔同嘅 remote 都會用其他唔同嘅 Protocol。好似 Sony 會用 Sony SIRC infrared protocol[^2]。兩者之間嘅 carrier wave 頻率不一，Address & Command Pair 嘅 implementation 亦有差異。不過 message 入面意見包含 Address & Command。有興趣歡迎去 <https://www.sbprojects.net/knowledge/ir/sirc.php> 睇。

> ![image13]({{ site.baseurl }}/assets/images/flipperzero-infrared/image13.png)

> 係 Flipper Zero Offical Site[^3] 偷翻來嘅硬件解說圖

> ![image12]({{ site.baseurl }}/assets/images/flipperzero-infrared/image12.png)

> ![image1]({{ site.baseurl }}/assets/images/flipperzero-infrared/image1.png)

> 我手上嘅係 nowTV 嘅解碼器 remote，發現佢係用 NECext Protocol。

> ![image14]({{ site.baseurl }}/assets/images/flipperzero-infrared/image14.png)

> New Remote Get

> ![image7]({{ site.baseurl }}/assets/images/flipperzero-infrared/image7.png)

> 生活智慧王之雖然人類肉眼睇唔到 IR，但係相機 CMOS 可以影到。如果唔知遙控有無電，對住相機撳制見到紫光就知有電。

> ![image4]({{ site.baseurl }}/assets/images/flipperzero-infrared/image4.png)

> 當你以爲撳住 remote 係會不斷 send signal，實際上後面嘅 signal 只係叫個電器睇翻第一個 signal…

---

### Modulation (調制 / 調變)

前人係做 IR Signal 嘅時候有預想過係生活中有大量 Ambiant IR，例如所有物體都會發射紅外線。爲咗減低外界干擾，IR LED 嘅 signal 並非好似上面咁靚，而係經過 modulation (調製)。關於 modulation 會之後投稿 SDR 嗰陣再仔細講。

Modulation 嘅本質就係將要傳輸嘅信號，換作其他 frequecy 先傳輸。通常傳輸嘅 frequency 係高過 signal frequcy 本身。而傳輸所依賴嘅載體稱爲 carrier wave。

以 NEC 爲例，carrier wave frequency 係 38.222kHz。換句話說，IR Receiver 可以每 26.16 µs 運作一次，如果以 26.16 µs 間距收不到一次 signal 就可以視作雜訊。如此一來可以摒除雜訊，避免意外觸發電器。

### Universal Remotes

Flipper Zero 其中一個功能就係 Universal Remotes。顧名思義就係所有嘅電器可以用用同一個 Remote 控制曬。

好似 TV remote 嘅 power on 咁， Flipper Zero 實際上係會打曬所有佢已知 TV 嘅 Power On Protocol, Address, Command 嘅 dictionary。一個唔好彩真係要成兩分鐘射曬所有 payload 先中。但係好玩嘅係在未知電器嘅品牌，未知道 commad 嘅情況之下可以嘗試操控。

### Saved Remotes

毫無難度可言，就係上文記錄好遙控器嘅 IR Command。Github[^4] 上面有一個 Repo 專門記錄一堆可以比 Flipper Zero 用嘅 .ir 文件，放入 Flipper Zero 就可以當佢係原生嘅 remote 咁使用。有趣嘅係如果唔知對應嘅 protocol，用 raw 需要填翻 frequency 同 duty cycle。下面 Sharp Aquos TV 嘅 frequency 就代邊 38 kHz。歡迎大家上 <https://github.com/Lucaslhm/Flipper-IRDB> download 曬所有 remote。

![image15]({{ site.baseurl }}/assets/images/flipperzero-infrared/image15.png)

![image10]({{ site.baseurl }}/assets/images/flipperzero-infrared/image10.png)

### 後記

![image17]({{ site.baseurl }}/assets/images/flipperzero-infrared/image17.png)

Make Infrared Great Again！好懷念以前可以用智障手機經 Infrared 就可以傳輸資料嘅日子。

如果你係 00 後唔知道智障手機嘅 Infrared 可以拎嚟傳輸相片，歡迎睇返佢嘅 implememtation 同 protocol[^5]。

<https://ww1.microchip.com/downloads/en/DeviceDoc/adn006.pdf>

### 預告

下期應該 (終於) 講 Sub-GHz 嘅功能，例如可以係街開人地 Tesla 嘅充電蓋。希望有有心人資助我一部 Tesla 作研究用途。

> ![image5]({{ site.baseurl }}/assets/images/flipperzero-infrared/image5.png)

> 示意圖[^6]，會發現 IR signal 實際上係更高頻率嘅 carrier wave 作調製。係 oscilliscope 上會咁樣出現。

> ![image2]({{ site.baseurl }}/assets/images/flipperzero-infrared/image2.png)

> ![image8]({{ site.baseurl }}/assets/images/flipperzero-infrared/image8.png)

> 左：TV Universal Remotes 介面

> 右：Enum over 290 known On/off

> ![image3]({{ site.baseurl }}/assets/images/flipperzero-infrared/image3.png)

> ![image11]({{ site.baseurl }}/assets/images/flipperzero-infrared/image11.png)

> 成功用 Universal Remote 熄電視

> ![image9]({{ site.baseurl }}/assets/images/flipperzero-infrared/image9.png)

> 就係用 saved remote 搞人地 projector，知道對方用 Epson 節省不少 brute force 時間

> 寫到最尾先發現有個功能可以直接睇未知嘅 raw IR signal，圖爲屋企嘅 panasonic 冷氣開關...

> ![image18]({{ site.baseurl }}/assets/images/flipperzero-infrared/image18.png)

> ![image6]({{ site.baseurl }}/assets/images/flipperzero-infrared/image6.png)

[^1]: <https://techdocs.altium.com/display/FPGA/NEC+Infrared+Transmission+Protocol>

[^2]: <https://www.sbprojects.net/knowledge/ir/sirc.php>

[^3]: <https://docs.flipper.net/infrared>

[^4]: <https://github.com/Lucaslhm/Flipper-IRDB>

[^5]: <https://ww1.microchip.com/downloads/en/DeviceDoc/adn006.pdf>

[^6]: <https://www.circuitbasics.com/arduino-ir-remote-receiver-tutorial/>
