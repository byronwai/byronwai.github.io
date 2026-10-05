---
layout: post
title: "[新手向] 免費Telegram bot 之 server前期設置"
date: 2017-01-19 15:11:23 +0000
slug: "新手向-免費Telegram-bot-之-server前期設置-1"
tags: [Apache, Cloudflare, Telegram bot]
---

幾經辛苦終於建立telegram bot！  
由於好像無一篇文章可以好好整合server設置的steps，我決定寫一篇step to step go through一次。

### 0. 前言

Telegram的好處太多，其中一項為支援用家寫bot去處理訊息，甚至可以寫[遊戲](https://storebot.me/bot/werewolfbot)。  
從[官方API](https://core.telegram.org/bots/api)裡，我們得知bot處理訊息有兩種，<font color="red">setWebhook</font>跟<font color="red">getUpdates</font>，有興趣了解當中分別的可以參考[這裡](http://www.hksilicon.com/articles/1087698)。

以下教學主要圍繞：

1. https 設置
2. setWebhook 的 online server設置

如果你只想用desktop掛bot，或是使用getUpdates處理訊息的話，那麼可以先行離開。

### 1. 配置

為了達成以上目的，我們需要以下三項東西：

1. Server
2. Top-level Domain
3. [Cloudflare](https://www.cloudflare.com/)

當然如果你有錢買SSL的話，除第一項之外，其他東西是optional的。可是Let’s Encrypt的Free SSL是不管用的，Telegram要求的server要common name = domain name和[一些相對次要的要求](https://core.telegram.org/bots/webhooks)。關於CN要等於server domain的慘痛經歷，還是可以參考[這裡](http://www.hksilicon.com/articles/1087698)的。

### 2. 申請Server

坊間有不少免費server，可是建立telegram bot不可能掛在靜態伺服器之上，因此不可能使用GitHub原生網頁達成目的。  
[Bytehost](https://byet.host/)跟[000webhost](https://www.000webhost.com/)等動態伺服器(i.e.即支援PHP的server)則可以掛載telegram bot。(注: 000webhost於2015年曾有[密碼洩漏](http://www.forbes.com/sites/thomasbrewster/2015/10/28/000webhost-database-leak/#6623988b17c1)的先例，使用000webhost與否就自行判斷。)  
我自己使用的server則是[InfinityFree](https://infinityfree.net/)，不過與[Bytehost](https://byet.host/)相比起來大同小異。反正要動態server就可。

以下例子將使用[Bytehost](https://byet.host/)進行，於其他server上建設也相類似。

當然是要申請server了，按指示一步一步做就可以。Sub Domain Name就是你希望的網址，一旦決定就不能再更改。不過稍後申請的Top-level Domain會跟現在的這個網址稍微不一樣，因此現在Sub Domain Name隨便寫一個就好。下圖作為例子：  
![server_01]({{ site.baseurl }}/assets/images/20170119/server_01.png)

沒問題的話現在會看到這樣的一個網頁，提示你要登入自己的email account去做activation。email有機會會在spam裡面，沒收到email可以看一下垃圾郵件。  
![server_02]({{ site.baseurl }}/assets/images/20170119/server_02.png)  
![server_03]({{ site.baseurl }}/assets/images/20170119/server_03.png)

Activation完成後會出現以下的一個網頁，請好好記下information，不見了的話我也不能幫你了。(笑)  
(Homepage URL跟panel的information是最重要的，其他的可以從panel裡面找回來。)  
Control panel的username跟password是用來login cpanel，作server side的調整。  
FTP那部分是用來上傳你的網頁跟程式，有關內容不在本篇文章討論範圍內。  
MySQL的那個也不作討論。(笑)  
![server_04]({{ site.baseurl }}/assets/images/20170119/server_04.png)

現在打開自己的web page當然是空空如也。  
![server_05]({{ site.baseurl }}/assets/images/20170119/server_05.png)

申請server的部分就到此結束。  
到現在為止我們還沒有https，千萬不要先去申請SSL，因為CN要等於domain name，這樣就違背了最初的目的。  
如果你只是想要server寫webpage，tutorial到這裡也就結束了。

### 3. 申請Top-level Domain

為甚麼需要top-level domain呢，這是因為方便掛在[Cloudflare](https://www.cloudflare.com/)上而需要的。如果想要申請[.tk](http://www.dot.tk/zu/index.html?lang=zu)的domain，可以直接參考[這裡](https://www.freehao123.com/tk/)。  
我推薦的則是[Freenom](http://www.freenom.com/en/index.html)，只要能用就好。  
到[Freenom](http://www.freenom.com/en/index.html)那裡去申請一個account，這邊就不作tutorial了。  
(注: Bytehost出於不知明原因，不容許 .tk 網域 park domain，因此我使用 .ga 網域)

那麼我到[Freenom](http://www.freenom.com/en/index.html)上找找有沒有未被使用的domain。  
(這邊的狀態是我已經login Freenom)  
![domain_01]({{ site.baseurl }}/assets/images/20170119/domain_01.png)  
![domain_02]({{ site.baseurl }}/assets/images/20170119/domain_02.png)

Freenom可以提供1 - 12個月的free domain，未來需要每年再續domain。那我先用3個月free作一個demo。  
![domain_03]({{ site.baseurl }}/assets/images/20170119/domain_03.png)

先按continue，把domain name先申請下來再慢慢設置。再把資料填妥。  
![domain_04]({{ site.baseurl }}/assets/images/20170119/domain_04.png)  
![domain_05]({{ site.baseurl }}/assets/images/20170119/domain_05.png)

到 Service 下的 My Domain 檢查是否已經申請好。  
![domain_06]({{ site.baseurl }}/assets/images/20170119/domain_06.png)

Domain name申請就完成啦！

### 4. Domain掛載 (Park Domain)

回去server的panel，也就是step 2申請的那個。  
去parked domain，記下DNS server。  
![park_01]({{ site.baseurl }}/assets/images/20170119/park_01.png)  
![park_02]({{ site.baseurl }}/assets/images/20170119/park_02.png)

現在回去login Freenom，service中的My domain，找到剛才申請的domain，按Manage Domain。  
![park_03]({{ site.baseurl }}/assets/images/20170119/park_03.png)

找到後再到Manangement Tools，按一下Nameservers。  
![park_04]({{ site.baseurl }}/assets/images/20170119/park_04.png)

接下來就要把domain的Nameserver轉到server上。(在我的例子就是轉到[Bytehost](https://byet.host/)上。)  
挑選Use custom nameservers，再把剛才記下的DNS server填上去。在圖片中我已經填好了。  
![park_05]({{ site.baseurl }}/assets/images/20170119/park_05.png)

如果出現這個面頁就代表已經成功，等最多24hrs。我第一次掛上去的時候等了大概10分鐘就完成。  
![park_06]({{ site.baseurl }}/assets/images/20170119/park_06.png)

然後就回去server，Parked Domain填上step 3申請的domain name。  
![park_07]({{ site.baseurl }}/assets/images/20170119/park_07.png)

看到以下兩個面頁，就代表已經完成，先慢慢等，先去逛逛稍後再回來。  
![park_08]({{ site.baseurl }}/assets/images/20170119/park_08.png)  
![park_09]({{ site.baseurl }}/assets/images/20170119/park_09.png)

### 5. Cloudflare掛載

首先，當然是註冊[Cloudflare](https://www.cloudflare.com/)帳戶。  
如果已經有帳戶就直接登入。  
![cloud_01]({{ site.baseurl }}/assets/images/20170119/cloud_01.png)

應該會直接出現以下的面頁，填上申請好的<font color="red">Top-level Domain</font>，按一下Scan DNS Records，然後等45秒。  
![cloud_02]({{ site.baseurl }}/assets/images/20170119/cloud_02.png)

檢查是否已經列出所有DNS，沒有的話有兩個可能性：

1. Domain Name未完全park好
2. 你擁有其他子網域

Case 1的處理方法就只有等，而Case 2則要自行手動添加。  
![cloud_03]({{ site.baseurl }}/assets/images/20170119/cloud_03.png)

因為懶惰的緣故，請把上圖的所有雲tick為orange colour，方便稍後建立https。  
(當然有很多灰色雲的話，可能你有step做錯)  
![cloud_04]({{ site.baseurl }}/assets/images/20170119/cloud_04.png)

窮苦學生當然要 Free Website 就可以了。  
![cloud_05]({{ site.baseurl }}/assets/images/20170119/cloud_05.png)

按指示去<font color="red">Top-level Domain</font>(Freenom)更改Nameserver。  
![cloud_06]({{ site.baseurl }}/assets/images/20170119/cloud_06.png)  
![cloud_07]({{ site.baseurl }}/assets/images/20170119/cloud_07.png)

再進入漫長等待，直到Nameservers更改成功。(又可以去逛逛了，哭哭)  
![cloud_08]({{ site.baseurl }}/assets/images/20170119/cloud_08.png)

直到CloudFlare出現以下畫面：  
![cloud_09]({{ site.baseurl }}/assets/images/20170119/cloud_09.png)

再回去Top-level Domain的網址，我的就是[https://abnormalexample.ga/](https://abnormalexample.ga/)，如果Browser沒有彈出警告的話，那就大功告成啦！  
![cloud_10]({{ site.baseurl }}/assets/images/20170119/cloud_10.png)

### 6. 後記

想不到打一篇這樣的文章這麼花時間阿。下一次還是不要打這麼仔細(誤)！  
如果看完這篇文章還有不明白的地方，可以到下面comment(有時間弄就是了)或參考下面文章：  
[\[免費SSL\]Cloudflare 免費憑證讓網站綁上SSL加密連線(https)](https://sofree.cc/cloudflare-free-ssl/)  
[网站放在国外打开慢?cloudflare免费CDN加速使用方法与教程](https://www.freehao123.com/cloudflare-cdn/)  
[\[教學\] 如何在ByetHost免費空間中安裝WordPress、含綁米(綁網域)設定](https://www.jinnsblog.com/2013/06/byethost-wordpress-mysql-install.html)

謝謝各位看官！

最後放上SSL Server Test的結果：  
![suff_01]({{ site.baseurl }}/assets/images/20170119/suff_01.png)

還有滿滿的雷姆！  
![dbe3f403ef26426ea62a391e80ce11db]({{ site.baseurl }}/assets/images/remu/dbe3f403ef26426ea62a391e80ce11db.jpg)
