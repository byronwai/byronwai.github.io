---
layout: post
title: "Car Hacking @ VXCON 2024"
date: 2024-12-31 12:00:00 +0000
slug: "Car-Hacking-VXCON-2024"
tags: [Car Hacking, Conference, VXCON]
---
### 前文提要

之前我係 Volume 4 “SINCON 2024 Recollection”一文中講及 car hacking software level 點玩，如何利用 “can-utils”控制現代汽車 CANBus。今年係 VXCON 2024 我有份籌備同出席 Car Hacking Workshop，睇下今次嘅 Host - Jay Turla (@shipcod3) 會點演繹 Car Hacking。

### 事前準備

買咗一堆野，但係當日用嘅只有紅色嗰啲：

  - 紅黑喇叭線
  - 杜邦線 / 排線
  - ODB2 16 針 Male Female 接頭
  - MCP2515 CAN Bus
  - Arduino nano V3.0
  - MKS CANable 2.0
  - DC Power Supply
  - Mazda 2 儀表板 (Instrument Cluster)

故事教訓係買 PCB 類嘅野唔好買預先焊接好嘅，因為 Speaker 將 CAN Bus 同 Arduino nano 焊埋一齊。針腳長度唔啱的話要先解焊再重新焊接。

### Wiring

我有諗過係咪因為 Mazda 2 嘅 Wiring 已經有人 leak 咗所以 Speaker 先用 Mazda 2 做示範。

當你揸住 Mazda 2 Instrument Cluster 嘅時候會有兩個 Connecter。

![image8]({{ site.baseurl }}/assets/images/car-hacking-vxcon-2024/image8.png)

根據 Manual 我哋知道 Cluster Terminal 2U, 2S 本身係連接電池嘅 +12V, Terminal 2A 就接地。

![image2]({{ site.baseurl }}/assets/images/car-hacking-vxcon-2024/image2.png)

但係 CAN Bus 嘅位置係 Manual 入面講話係 BCM (Body control module) 用 CAN Bus 連接不同 modules。

後來搵到下圖，得悉 Cluster Termainl 2B 同 BCM Terminal 7X 用 CAN High 連接。

![image1]({{ site.baseurl }}/assets/images/car-hacking-vxcon-2024/image1.png)

就明白點解 Cluster Terminal 2A, 2U 接駁 12V DC 電源，而 Cluster Terminal 2B, 2D 需要連接 MKS CANable 2.0。

![image9]({{ site.baseurl }}/assets/images/car-hacking-vxcon-2024/image9.png)

---

### CAN Bus

CAN Bus 用嚟連接成架嘅車嘅電子控制器。後來發現 CAN 有兩款 Standard (ISO 11898-2, ISO 11898-3)，反正幫手控制 CAN Bus 嘅 CANable 2.0 會自己控制咁我就跳過理論。

睇返 Mazda 2 嘅 Manual，CAN Bus 會控制 Instrument Cluster 以下嘅部分：

  - ABS warning light illuminates
  - MIL illuminates
  - Brake system warning light illuminates
  - Speedometer indication
  - Tachometer indication
  - Low / High engine coolant temperature indicator light

當然 Speaker 有講到 Override CAN 可以控制車嘅更多部分，係 Lab 只會改到 Cluster display。

現實生活中我哋好少會直接吉 Cluster or ECU，更多嘅係用車嘅 Diagnosis 接頭 ODB-II。OBD-II 接頭當中有兩個 Termainl 控制 CAN Bus，理論上係可以自製 ODB-II 接頭，用 CANable 2.0 透過電腦控制汽車。

![image7]({{ site.baseurl }}/assets/images/car-hacking-vxcon-2024/image7.png)

ODB-II 插頭位置

![image5]({{ site.baseurl }}/assets/images/car-hacking-vxcon-2024/image5.png)

經過漫長 troubleshoot 之後，終於成功上電開機。

### CANable 使用方法

係一開始嘅時候，Speaker 點都用唔到 CANable 控制 Cluster，後來發現未更新 CANable firmware。

![image4]({{ site.baseurl }}/assets/images/car-hacking-vxcon-2024/image4.png)

CANable 真貌

![image6]({{ site.baseurl }}/assets/images/car-hacking-vxcon-2024/image6.png)

連上之後會見到多咗 CANable 2 device

### can-utils

can-utils 使用方法請參閱 Volume 4 “SINCON 2024 Recollection”一文。

但係我想介紹嘅係 command `cangen` 同 CAN message ID。正常只有 Cluster 情況下好難去 test 每個 operation 對應邊個 message ID，而 CAN message 需要正確嘅 ID 先可以控制對應嘅部件。

Once again，[上網](https://docs.google.com/spreadsheets/d/1wjpo5WGLxsswjUi0MUDwKySKp3XejPfE5vdeieBFiGY/edit?gid=0#gid=0)已經有人做好 Mazda 3 嘅 message ID。差一代應該唔會差太多掛？

![image3]({{ site.baseurl }}/assets/images/car-hacking-vxcon-2024/image3.png)

`cangen` 就後可以嘗試 fuzz known message ID 後面個啲 value，縮細範圍去估計會食咩 value。當然 `cangen` 可以幫你 fuzz 埋個 message ID 係後話。
