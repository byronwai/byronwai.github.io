---
layout: post
title: "How to Hold a Proper CTF"
date: 2025-12-31 12:00:00 +0000
slug: "How-to-Hold-a-Proper-CTF"
tags: [CTF]
---

本文志在記錄並總結我(們)過往舉辦 CTF 的經驗，並提供予其他主辦以參考。亦即，選擇特定 methodology 的 rationale 及其 trade-off。同近期 CTF 無直接關係。

> 點解香港嘅夜場會搞到咁嘅樣？
> 
> ——《老豆咪索K》

# What is CTF?

如果咁唔好彩本文已不知被吹到哪裡，容我先解釋下咩叫 Capture the Flag (CTF)。CTF 就是主辦方會係特定嘅題目 (as online or as attachment) 放入特定嘅 string 並稱為 flag，參賽者獲得 flag 後可證明自己解題成功。

CTF 可以分為三大 type：

- Jeopardy Style
- Attack and Defense (A&D)
- King of the Hill

!!!
Note: 由於我無舉辦過 A&D，不太好評價。
!!!

Jeopardy Style 係一種常見，而且容易 host 嘅形式。無錯就是模仿電視節目 “Jeopardy!”。佢係一種 Quiz-like 嘅形式，作者提問，參賽者回答。以 PicoCTF[^1] 為例，可以見到有 Challenge Description，即作者會描述有關自己題目，提供初步解題方向。

![image6]({{ site.baseurl }}/assets/images/proper-ctf/image6.png)

於 Jeopardy Style[^2] (解題模式) 中，題目分為：

- Pwn
- Reverse
- Web
- Cryptography
- Misc

亦會出現其他類別如 Forensic，Mobile 等，取決於主辦方的心念。

# Team Formation

可以舉辦 CTF 的大前提是要有一個 team。除非你個人能力好強 or 你嘅 CTF 並非面 public，否則 teammate 各司其職有其重要性。

要 host 一場 CTF 通常有以下分工：

- Project Management
- Challenge Author
- Infrastructure
- Quality Assurance
- Public Relations

## Project Management (PM)

PM 就是一個要負責大量事情的 Role，對內就要負責睇 Project 進度，對外就是要同主辦 or 金主交代 progress，或者審視金主嘅要求並預想其可能性。最壞情況就是金主有奇怪命令，Dev Team 拒絕直接執行，PM 就需要思考折衷方法。舉個例子，金主係最後一日先提出話要加 feature 容許 per team 改自己 avatar，咁 PM 要考慮 business impact，應唔應該直接 reject 定係 chur Dev Team 了。

除咗整合各個 party 嘅聲音之外，仲要睇住 Project 進度有否符合預期。出現 feature 過咗 deadline 但係未收到貨嘅時候，幾時要拎出 backup plan 都係要 PM 思考的。例如，有 challange author 突然話無貨交，係咪要將責任轉移比其他 author，定係需要直接 cancel？

結果好多時 PM 就兩邊不是人，仲未計要直接面對其他人嘅情緒。如果無 CTF involve (join CTF, challenge dev, etc.) 經驗就更加難掌握自己 team 嘅實際處境。所以我會認為 PM 未必係需要一個好強嘅 CTF player，但是需要有 domain knowledge 去理解 project 細節。

---

## Challenge Author

Challenge author 嘅能力直接決定咗題目嘅難度同所需知識嘅廣闊程度。Challenge author 通常有唔同強項，所以會集中寫自己最熟悉嘅 category 嘅題目。例如 Pwner 理所當然地會 dev 得最多 pwn challenge。

但是 Challenge author 除咗要思考點樣去卡人關之外，同時應該肩負起 knowledge delivery 嘅責任。你出嘅題目想教識其他人乜嘢呢？單純為 trick 而 trick 可以話係最差嘅題目。學識通靈之後參賽者可以獲得幾多知識離開？Challenge author 無比明確嘅方向，直接係 challenge description 剩係寫一個字，要參賽者揣摩 author 心思也是一種會令參賽者陷入 fustration 。

## Infrastructure (Infra)

1. 確保 challenge 成功 deploy 可以比其他人玩
1. 確保 challenge uptime 符合 SLA，更簡單就是唔好死 challenge
1. 同 1,2，但係 for challenge platform

Infra 有時難搞嘅地方在於 challenge author 比嘅 environment 唔符合規格，需要同 challenge author 協商並進行修改。舉個例子，我哋規定每個 challenge 只能一個 port 對街，但係 challenge author 需要開 websocket + HTTPS 對 external。屆時 infra 就要告知 challenge author 問題癥結，同時協助 challenge author 修改 environment。

## Quality Assurance (QA)

就係睇下啲 challenge 出嘅有無符合 author 同 team 嘅預期，有無 unintended solution 存在。

## Public Relations (PR)

![image3]({{ site.baseurl }}/assets/images/proper-ctf/image3.png)

## Target Audience

當你好似 RPG Game form 好咗你嘅 Team，就係時候思考你嘅 Team 可以打啲咩嘅魔王。Team 嘅能力直接限制咗你可以 serve 嘅 Target Audience。例如 (正常情況下) 我哋唔會 expect 一個中學生可以寫 challenge 比 general public，比公衆的話無疑越級打怪。

所以可以先考慮兩個問題：

- Team 嘅整體實力容許你哋 serve 咩人羣？
- 你實際上需要 serve 嘅人羣係咩？

思考好兩個問題之後就可以着手 create challenge，提供合適難度嘅 challenge 比 target audience。根據過往經驗 target audience 嘅 spectrum 越闊，對 team 嘅考驗更大。既要照顧新手，予以合適嘅指導渡過新手期；又要照顧老手，出有難度嘅題目去令老手獲得成功感。但是 Team 嘅精力同比賽嘅 duration 只容許出有限嘅 challenge，不能出大量 challenge 去 fulfill 悠悠衆口。

# Name of Contest

一個比賽名就係代表住一個 organization or 一個 brand，其實用咩名都無咩所謂，只要言之成理。

唯一就係驟忌就係搞咗 event 幾次之後轉名。就好似 C3 搞咗幾年再返嚟變咗 AFA，都要花大量時間令人將兩個 brand 聯想起嚟。

# Preparation & Chal Dev

好多人都 understimate 咗搞一場 CTF 嘅 preparation time，當然籌備時間同比賽時間同題目數量成正比的。以一場 target to international 嘅 48 hours 比賽，題目數 45 條左右，team size 10 人，preparation time 以半年為佳。少過半年會對 team 內產生壓力，甚至榨壓 QA 時間空間，更唔好講有時金主要求 platform 要做 pentest 同 stress test，要花額外時間去處理。

當然如果係做 6 hours 嘅比賽比大專生，題目數同難度降低，platform 又用埋現有 solution (e.g. CTFd)，preparation time 可以大幅下降。

至於 challenges development，我覺得佢 serve 兩大 purpose：

- Knowledge Delivery
- Team member train-up

Knowledge delivery 就是點樣將（至少）一個 learning point 包入題目。但是大前提就是要保證 idea 嘅 uniqueness，可以參考前人嘅題目但不能抄襲。諗下，如果我可以直接 google partial 嘅題目搵到一樣嘅題目解甚至 flag，咁 CTF 只係考參賽者 google hacking skills (or Baidu hacking)，而非測試相應嘅 CTF skills。甚至有啲比賽係直接可以 google 到作者抄咩 flag，巧唔健康。

另一方面，CTF 嘅本質係 cybersecurity training，唔係通靈之戰：

![image4]({{ site.baseurl }}/assets/images/proper-ctf/image4.png)

當大部分嘅題目都係 guessy，covert channel，proprietary standard 咁玩起上嚟只係揣摸作者心意，隨時拎個羅庚出嚟計 flag 仲快過正攻。

![image5]({{ site.baseurl }}/assets/images/proper-ctf/image5.gif)

單純係 Nokia 8810 靚先擺係到，同近期 CTF 無咩關係

除此之外要考慮 flag 直觀嘅問題，有部分題目例如 disk forensic 無可避免好難直接寫 `flag{...}` 係 attachment 入面，會容易直接 grep 到。但是係一堆 file 入面 drop 段 base64 嘅 string as flag (不含 flag format) 需要 decode，同時要參賽者砌 flag，我認為係無意義嘅廢招，單純為噁心同拖慢參賽者。

至於 training 部分，CTF player 未必需要知道 challenge 嘅 setup，or 如何合理地做 knowledge delivery。同時一個 team 需要有新血，通過 hosting CTF 去 train up 新人並令其了解更多細節係需要的。

# Flag Format

通常 flag format 會係該 CTF or organizer 嘅名 (e.g. `b6a{...}`)，不然至少都會係 `flag{...}`。

如果係同一個 CTF 見到有多過一個 flag format 出現，要麼係 fake flag，不然我會判斷為主辦連比賽都無心搞，係無任何原因有 multiple flag format 的，吧？

更唔好講話抄人題目，連 flag format 都抄埋。香港 2018 年唔係未試過啲咁嘅野。

# Scoring Method

我想討論兩樣野：

- First Blood
- Static / Dynamic Scoring

First Blood 目的係為咗獎勵第一個 solve 嘅 team，同時如果有同分 (未含 first blood) 嘅 team 可以通過 first blood 數目去計算名次。所以多數有 first blood 嘅 CTF 都會 +1 分作象徵式獎勵。 但是 first blood 前題要考慮，CTF 開始嘅時候所有參賽者係咪都係同一起跑線上？例如參賽者係 in different time zone，唔係所有人都同一時間可以 access 題目，first blood 就會組成不公平。

Scoring method 亦係一個頭痛點。Static scoring 優點就係簡單容易 handle，對於初次玩嘅參賽者見到題目高定低分可以估算難度，揀自己適合嘅題目玩。但是 Static scoring 嘅難度估算只係作者自己估計，萬一有簡單嘅 unintended solution 出現，就會令參賽者用 score 去估算自己嘅實力。

至於 Dynamic scoring 就相反，score 嘅多寡同 solve count 成反比例。雖然無作者估算嘅 score 但係隨住時間經過，參賽者可以慢慢見到邊啲題目低分 aka 容易，難度同 score 會相對掛鉤。But！Dynamic scoring 除咗同頭先嘅 static scoring 相反之外，仲有一個隱藏嘅痛點。當題目數太多 or team 數目太少，每條嘅 trial sample size 太少的話分數一樣唔準確。例如主辦係 48 hours 比賽嘅最後 7 hours 出超級簡單嘅題目，但係可以 last 到最後嘅參賽隊會隨住時間減少，題目最終 score 同佢難度有機會脫鉤。所以我認爲 Dynamic scoring 適合相對少題目，同 target 老手嘅場。

# Terms and Conditions

主辦雖然有嘅解釋權利，但係大部分 rules 都應該要公開的吧，唔係開始前 24 hours 先同人講。

就好似 scoring mechanism，travel expense sponsorship，等等都應該要係開始前講定，唔係臨開始 or 開始咗先 announce 的。

# Support

就，比賽時間無理由 challenge author 同 infra 有長時間休息的。畢竟 challenge author 為自己出嘅題目負責，有需要向參賽者 clarify 。最理想情況下至少要有 challenge author 以外嘅人理解題目，可以係 challenge author offline 嘅時候作 extra support。Say，全部人都可以 9pm - 9am 休息的話，比賽就有 50% 時間無 support，infra down or challenge 出錯會欠缺支援，仲未計 oversea 嘅 time zone 唔 match，一來一回隨時無咗一日。長時間所有 admin offline 係不理想嘅做法。

另外就係，現代 CTF 用 discord 做 official 嘅 communication channel，discord permission 理應要 set 好唔比 non-privileged user 可以係全部 channel (e.g.  announcement ) 寫 arbitrary message。加上 admin 嘅 down time，無人維持秩序會令 channel 陷入 chaos。

同埋我很喜歡 discord 中使用 ticketing system 作 support，除咗可以令分工明確唔洗係 message 嘅海洋入面搵返要 support 嘅人，就係可以避嫌。如果每個人都 PM challenge author，其實無 3rd party 知道兩個人嘅對話，有無泄漏 extra information。相反 ticketing system 係所有 discord admin 可以 access，其他人可以 review 返 message record，或者 handle 要多過一個 helper 負責嘅問題。

# FeedBack

We treasure all your opinion，意見對於 CTF 發展是有利的，同時可以估算未來 CTF 調整方向。

所以 feedback 並唔應該係用嚟洗正評嘅一個手段。為什麼要恐懼 negative opinion[^3]？

![image2]({{ site.baseurl }}/assets/images/proper-ctf/image2.png)

![image1]({{ site.baseurl }}/assets/images/proper-ctf/image1.png)

# 後記

既然 CTF 係鼓勵犯錯 learn from mistakes，私認為作為 CTF host 都唔會每次都完美，需要擁抱錯誤敢於承認。但是，主辦方無自己一套 rationale solely 依賴 vendor，唔會有進步的。

---

[^1]: <https://play.picoctf.org/practice/challenge/427>
[^2]: <https://www.youtube.com/watch?v=8ev9ZX9J45A>
[^3]: <https://ctftime.org/event/2998/weight> (<https://archive.ph/fT3h7>)
