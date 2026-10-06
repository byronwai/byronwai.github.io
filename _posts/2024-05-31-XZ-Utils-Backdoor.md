---
title: "XZ Utils Backdoor"
date: 2024-05-31 12:00:00 +0000
slug: "XZ-Utils-Backdoor"
tags: [Supply Chain Security]
---
### 序

係今年 3 月 29 號 Microsoft 嘅 PostgreSQL Developer, Andres Freund (X / Twitter: @AndresFreundTec) 向 Openwall 提交咗一個關於 XZ Utils Backdoor 嘅漏洞。 (<https://www.openwall.com/lists/oss-security/2024/03/29/4>) 由於 XZ 係一個好多 Linux distribution 都會用嘅壓縮 application，同時亦係一單 upstream software 出事，屬於 supply chain attack 嘅 backdoor implementation。

註：Openwall 就係 develop John the Ripper 個間公司

### 破

Andres Freund 本職並非 Security Analysis， 但係 XZ backdoor 大部分 technical details 都係 Andres 本人搵出嚟。只能講話今次搵到 XZ Backdoor 係一個極其幸運嘅事件。係寫 newsletter 嘅時候我去咗聽 Andres Freund 係 0xide 上面嘅訪問 “[Discovering the XZ Backdoor with Andres Freund](https://oxide.computer/podcasts/oxide-and-friends/1843393)”。

係訪問入面，Andres 提及佢正在 benchmark 其他同事 dev PostgresQL 嘅 code，同事嘅 code 減少咗 I/O 運行應該會更快。不過實際 benchmark 嘅時候有啲 case 會影響表現。經過統計 (Regression) 之後發現整體嘅效能提升只有 1-2%，因此走去做 micro-optimaization 同檢查 non-I/O path 是否不受影響。

係後來 Andres 嘅檢查發現，當佢重複對同一個系統做 benchmark 嘅時候感覺有啲 noise， 測定嘅數據變化差異太大。因此 Andres 去檢查 benchmark 系統有無問題，benchmark 嘅時候 system 係 idle 緊定係有其他程式係後台佔用過多 CPU。發現 benchmark system 嘅 sshd (SSH Daemon) 佔用比正常多嘅 CPU，而且 sshd 直接 expose to internet 對街。一個正常嘅 SSH login 亦唔會直接調用 LZMA (XZ 嘅壓縮方法)。

Andres 感覺咁嘅行爲太過反常同可疑。正常嚟講係程式未執行到 main 嘅時候好少會大量佔用 CPU。同時間 sshd 唔係一個咁大型嘅程式，無需要花提多時間係 dynamic linker 搵對應嘅 libraries。Andres 亦有試過用 Github 上面嘅 XZ release，發現 Github release 版本並不會調用 sshd。經過一輪調查最後發現 Linux 入面嘅 XZ comprimize 咗。

### 急

後來嘅故事大家都好清楚，Jia Tan 點樣係 3 年內一步步獲得對 XZ 原作者 Lasse Collin 嘅信任。同時利用假 account 對 Lasse Collin 施壓。而且今次 attack 嘅時間係 Lasse Collin 準備緊 XZ for Java 同休息嘅時間，Jia Tan 自己有所有權限行動。

對於 XZ backdoor 嘅拆解可以去睇 Seebug 嘅 [blog post](https://paper.seebug.org/3157/)[^1] 睇詳細分析。

係 XZ 事件之後 OpenJS Foundation 係 JS Project 有搵到相類似嘅 [supply chain attack 手段](https://thehackernews.com/2024/04/openjs-foundation-targeted-in-potential.html)[^2]。雖然坊間有好似 [OpenSSF](https://openssf.org/)[^3] 咁嘅 orgianization 幫手保護 Open source project，但係攻擊都係防不勝防。

### Reference

<https://paper.seebug.org/3157/>

<https://www.ithome.com.tw/news/162130>

<https://www.openwall.com/lists/oss-security/2024/03/29/4/1>

<https://gist.github.com/thesamesam/223949d5a074ebc3dce9ee78baad9e27>

<https://github.com/tukaani-project/xz/issues/103>

<https://git.tukaani.org/?p=xz.git;a=commit;h=f9cf4c05edd14dedfe63833f8ccbe41b55823b00>

> 以 C++ 爲例，Compile 過後執行前嘅時候會先查找 shared libraries 再執行自己寫嘅 code。

> ![image4]({{ site.baseurl }}/assets/images/xz-utils-backdoor/image4.png)

> <https://www3.ntu.edu.sg/home/ehchua/programming/cpp/cp0_Introduction.html>

> ![image1]({{ site.baseurl }}/assets/images/xz-utils-backdoor/image1.png)

> 點解可以 by-pass 到 Linux Landlock？原因就係多咗一點令 Landlock 以為 execute 唔到

> <https://git.tukaani.org/?p=xz.git;a=commitdiff;h=f9cf4c05edd14dedfe63833f8ccbe41b55823b00>

> ![image2]({{ site.baseurl }}/assets/images/xz-utils-backdoor/image2.png)

> 似係 zetta 會做嘅野

> <https://news.ycombinator.com/item?id=39874404>

> ![image5]({{ site.baseurl }}/assets/images/xz-utils-backdoor/image5.png)

> ![image3]({{ site.baseurl }}/assets/images/xz-utils-backdoor/image3.png)

> 我真係有一刻諗緊真係絕筆

[^1]: <https://paper.seebug.org/3157/>

[^2]: <https://thehackernews.com/2024/04/openjs-foundation-targeted-in-potential.html>

[^3]: <https://openssf.org/>
