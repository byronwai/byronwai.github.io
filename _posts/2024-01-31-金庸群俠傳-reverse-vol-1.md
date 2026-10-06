---
title: "金庸群俠傳 reverse vol 1"
date: 2024-01-31 12:00:00 +0000
slug: "金庸群俠傳-reverse-vol-1"
tags: [Reverse Engineering]
---
金庸群俠傳 Reverse vol 1  
Author: G on JK

### 遊戲背景

金庸群俠傳 2 加強版是一款基於金庸群俠傳的創作遊戲，基於 Flash 運行並大幅更改原作遊戲模式。玩家進入遊戲後會扮演一名江湖俠客，學習不同武功心法外，更能體驗金庸筆下不同主角的心路歷程。

### 目的

遊戲中有不少招式學習前或進入場地前有隱藏條件，預先破解遊戲的話就可以直接得悉。例如周伯通會根據玩家悟性高低教授 左右互搏 或 空明拳。因此正常情況下玩家只能學習其一，不能一命通關獲得所有招式心法。我們亦可可以嘗試用特殊方法直接更改招式等級，省去大量招式升級時間。在未來文章中會介紹 Flash 與 ActionScript 之關係，Static Code Analysis 查看遊戲底層邏輯，存檔更改，及 Runtime 更改 variable。

### 遊戲執行

Flash Game 所使用的格式爲 .swf，使用以下程式即可播放：

  - flashplayer_32_sa.exe or [flashplayer_32_sa_debug.exe](https://archive.org/details/flash32-5y5r)
  - [Flash游戏修改大师v3.3](https://www.52pojie.cn/thread-1581470-1-1.html) (FlashGameMaster)

    - FlashGameMaster 可以在遊玩時作 Dynamic Analysis （i.e. 修改數值）

坊間有些人已經將 .swf 轉換爲 .exe，可免去額外程式安裝直接執行，但非本文重點。

### 存檔位置

存檔會在以下位置：

%APPDATA%\\Macromedia\\Flash Player\\#SharedObjects\\

根據本機擺放位置不同，其中的子目錄會有差異。可找到 gamezly.sol。本系列只會針對 gamezly.sol 作修改。

![image1]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-1/image1.png)

### 初始屬性

當玩家第一次遊玩時，會隨機配置屬性點。與其他遊戲不同，金庸群俠傳 2 初始屬性點皆為獨立隨機。

進入遊戲後會發現有至少 14 項屬性：

![image2]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-1/image2.jpg)

![image3]({{ site.baseurl }}/assets/images/jinyong-reverse-vol-1/image3.jpg)

在之後文章中會嘗試更改屬性，同時以靜態分析方法查看屬性更改條件，以及屬性值對遊戲劇情之差異。
