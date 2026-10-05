---
layout: post
title: "金庸群俠傳 reverse vol 4 - Dynamic Analysis"
date: 2025-03-31 12:00:00 +0000
slug: "金庸群俠傳-reverse-vol-4-Dynamic-Analysis"
tags: [Reverse Engineering]
---
在前兩期中，我們已經知道如何作 Static Analysis 拆解 Flash 遊戲代碼，以及更改遊戲存檔。本期前端以 Black-box 及 Gray-box 方法修改。

### 工具

以下 Demo 使用 [Flash Game master 3.3](https://www.xitongzhijia.net/soft/11697.html) 並使用以下功能：

  - 數值修改
  - 跳幀 (Skip Frame)

### 數值修改

在戰鬥中，內力是發動招式的關鍵。在本例子中，我們會嘗試找到內力的variable，修改並鎖定。

圖中所示，主角的內力爲 8829。在 `Edit` → `Open Edit Panel` 中嘗試尋找該數值

![image8]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-4/image8.png)

找到 `N_L0` 等於 8829：

![image9]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-4/image9.png)

若找到多於一項 variable 符合條件，可嘗試改變數值再次嘗試尋找。主角再使用功夫後，內力為 8779：

![image11]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-4/image11.png)

找到 `N_L0` 現在爲 8779，如此便能確認 `N_L0` 爲內力的 variable:

![image6]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-4/image6.png)

由於已經 Code Analysis 之後，確認戰鬥中只使用 `_root` 的 `N_L0`，修改即可。大膽更改到 9999 並鎖定。

![image5]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-4/image5.png)

若果你不肯定那個才是正確，二者都修改便可。

回到主戰鬥場景，現在內力爲 9999，確定修改成功。有部分遊戲不會實施看到變化，需要執行部分場景刷新數值，如購買道具。

![image4]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-4/image4.png)

大膽使用招式總結對手！

![image10]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-4/image10.png)

---

### 跳幀 (Jump Frame)

在介紹 Flash 組成時，我們知道 Flash 動畫都是以 `Frame` 為單位，每幀都可加插不同 Action Script 執行邏輯。因此，只要找到不同事件對應的關鍵幀，就可直接到達該劇情，免去繁瑣或矛盾的前置條件。

#### 左右互搏之術

在學習左右互搏前，辟邪劍法傷害為 3161：

![image7]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-4/image7.png)

左右互搏之術的學習條件爲：

  - 未學習空明拳
  - 悟性 < 51

顯然易見，主角現在並不符合學習條件：

![image3]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-4/image3.jpg)

左右互搏之術學習的關鍵幀是 frame 628, 我們可以直接播放該幀：

![image2]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-4/image2.png)

學習後明顯能見到變化，傷害判定變位兩次：

![image1]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-4/image1.png)

左右互搏之術傷害公式：

`總傷害 = 原傷害 * 0.75 * 2`

找到關鍵幀的方法有二：

  1. 在已知道劇情的幀前後嘗試 Jump
  2. Code Analysis

### 結語

這個系列已經到第四篇文章，希望大家可以用 Flash Game 爲引子，學習不同的 Reverse 技巧。在沒有防禦機制之下，不律用什麼語言編譯的遊戲都可用類近的思路破解。

P.S. 可以係 Bsides HK 2025 之前出曬，又要諗新連載 topic 了。
