---
layout: post
title: "[偽翻譯] Online Apache Server 上無法顯示 CSS"
date: 2017-04-14 02:27:26 +0000
slug: "偽翻譯-Online-Apache-Server-上無法顯示-CSS"
tags: [Apache, CSS caching]
---

前一段時間在弄 webpage design，用 Dreamweaver 弄好以後 Local 檢視完全未問題，可是放到 Server Side 就完全跑調了。仔細一看，發現 CSS 根本沒有套用上去啊。仔細 google 後，發現問題出在 CSS caching 上面。

### 0. 正文

我自己用的是 [Byethost](https://byet.host/) 跟 [InfinityFree](https://infinityfree.net/)，結果發現 update 網頁後幾分鐘後，refresh 依然沒有變化，原來是 server side 為了節省資源而先把 style sheet 進行 caching。

### 1. 解決辦法

我們把以下的 code 放在 HTML 的 head section 之內，把 HTML 當作 PHP

```html
<link rel="stylesheet" type="text/css" href="/stylesheet/的/位置<?php print('?'.filemtime('style.css'));?>"/>
```

或直接 include 在 PHP 之內

```php
<?php 
echo '<link rel="stylesheet" type="text/css" href="style.css?' . filemtime('style.css') . '" />'; 
?>
```

這樣就可以騙過 server，認為你的 CSS style sheet 是 dynamic style sheet，每次 refresh broswer 都會自己載入一次啦。

### 2. Reference

[http://php.net/manual/en/function.filemtime.php](http://php.net/manual/en/function.filemtime.php)  
[http://www.hudl.net/subcsscache.php?sub=csscache&i=2](http://www.hudl.net/subcsscache.php?sub=csscache&i=2)

### 3. 福利

![](http://i2.hdslb.com/bfs/archive/59cabf00681fd2569975e1b540dbdb040675ba7f.jpg)
