---
title: "金庸群俠傳 reverse vol 3 - Static Analysis"
date: 2024-10-31 12:00:00 +0000
slug: "金庸群俠傳-reverse-vol-3-Static-Analysis"
tags: [Reverse Engineering]
---
承上期，我們知道 AS3 是如何儲存在 SWF 文件之內，自己寫一個 decompiler 應該也是手到拿來。這部分我留給讀者作練習。

在下文中，我們會直接使用 jpexs-decompiler[^1] 拆解 金庸群俠傳 2 加強版。

![image6]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-3/image6.png)

jpexs-decompiler 啓動！

### Source

遊戲：<https://drive.google.com/file/d/14P9oS9gcTPXdHxpTMKA1HwXar7m9-Z-H/view>

攻略：<https://forum.gamer.com.tw/Co.php?bsn=60183&sn=323189>

### 目標

  - 不同功夫升級所需經驗值
  - 角色屬性
  - 學習功夫與秘籍的關鍵幀

### 功夫經驗值

我在 Decompile 之前，在 網上[^2] 找到前人關於不同變數的研究，可用作輔助 reverse 及驗算不同結果，如招式等級所需的經驗值變化、招式威力變化等。

### 降龍十八掌

我在下面的 reverse 以招式 降龍十八掌 爲例子，其他招式皆可使用同一方法拆解。 由於前人努力，我們知道所有功夫都跟漢語拼音相關。

功夫等級：`lv_xianglong`

功夫當前經驗值：`exp_xianglong`

從零開始的話，我們亦可以：

  - 完全 static analysis 找出所有 variable 之間的關係
  - 透過 Dynamic analysis 找出當前正在變化的 variable
  - 檢查存檔

直接搜索 `exp_xianglong`，可以在 `DefineButton2 (8421)` 中找到所有招式的 variable:

![image5]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-3/image5.png)

`frame 10577` 找到主角學習降龍十八掌的關鍵幀。播放該幀後主角便會習得降龍十八掌。

![image10]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-3/image10.png)

`DefineSprite (2575)` 中則記載功夫施放速度，及內力 (`N_L0`) 消耗與招式等級成正比。

![image11]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-3/image11.png)

`DefineButton2 (2456)` 之中，我們終於看到：

降龍十八掌的傷害公式

降龍十八掌各等級所需的經驗值

悟性 (`W_X`) 對於功夫經驗值提升速度

### 傷害公式

由傷害公式中可以找到，降龍十八掌傷害由以下因素影響：

  - 功夫基礎傷害
  - 以屬性身法為上限的隨機值
  - 屬性拳掌 × 功夫等級

![image1]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-3/image1.png)

同時拳掌屬性 (`Q_Z`) 會隨功夫等級上升，拳掌上限為 100。

惟功夫等級與經驗值不符時，且經驗值足夠功夫需要升級時會發生錯誤。

後來檢查時發現，其他功夫的傷害公式略有不同。以太玄神功為例：

![image8]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-3/image8.png)

### 初始屬性

在 `frame 55`，我們找到角色初始屬性。基本上每一項都為隨機值，屬性之間未見相聯關係。

![image4]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-3/image4.png)

### 學習特殊功夫前置要求

有部分功夫需要先學習武功秘籍，可以直接搜尋該武功秘籍的關鍵幀。

### 北冥心法 & 北冥神功

北冥神功的前置學習條件為北冥心法等級 5。透過代碼分析 (以及 cheatsheet)，以下 variable 與其相關：

  - `no_beimingXF`
  - `lv_beimingXF`
  - `exp_beiming`
  - `lv_beiming`

![image3]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-3/image3.png)

![image7]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-3/image7.png)

關鍵幀：`frame 2483`

![image9]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-3/image9.png)

學習流程：

  1. 習得北冥心法
  2. 提升北冥心法至 5 等
  3. 習得北冥神功
  4. 提升北冥心法至 10 等

習得心法至 5 等後與學習其他功夫無異。

### 左右互搏

左右互搏並非招式，以是可是同時可以攻擊兩次。因此其 variable 是 `aaa` 而非 `lv` 字段。

關鍵幀：`frame 607`, `frame 628`

左右互搏(`_global.aaa`)學習條件需要屬性悟性小於 51

![image2]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-3/image2.png)

但直接播放 frame 628 可直接習得，並無悟性限制。

[^1]: https://github.com/jindrapetrik/jpexs-decompiler

[^2]: https://wenku.baidu.com/view/51646c7a011ca300a6c3906d.html?_wkts_=1705916203897&needWelcomeRecommand=1
