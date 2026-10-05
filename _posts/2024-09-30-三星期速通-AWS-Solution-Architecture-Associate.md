---
layout: post
title: "三星期速通 AWS Solution Architecture Associate"
date: 2024-09-30 12:00:00 +0000
slug: "三星期速通-AWS-Solution-Architecture-Associate"
tags: [AWS, Certification]
---

## 序

是咁的，由於金主媽媽 sponsor 考一張 AWS Associate level 嘅 cert ，但係要係 20 Aug 之前考，所以係英國返香港之後就開始準備 Exam。

## Why Solution Architecture?

AWS 而家嘅 cert 係無需 Prerequisite 去考。通常入門認識 AWS 會考 Cloud Practitioner (CLF-C02) 去認識 AWS 不同嘅 services。由於 Cloud Practitioner 太簡單可以裸考嘅緣故，我就直接去打 Solution Architecture。Solution Architecture 係上位版嘅 Cloud Practitioner，一樣要認識 AWS 不同嘅使用方法、定位、同 use cases。由於我而家工作性質要 review 公司嘅 AWS Infra Setup，讀返 Solution Architecture 內容會更容易理解使用不同 service 嘅原因，同 review 有機會發生嘅  misconfiguration。舉個例子，一個 VPC 係會同時俾 Security Group 同 network ACL 控制 inbound outbound traffic，但係前者係 stateful 後者係 stateless，兩個 control 係會同時生效。如果只係 customize Security Group 而無 customize network ACL，該 VPC 係會用 default network ACL a.k.a. allow all inbound and outbound traffic to VPC。

註：細心嘅朋友係到已經發現，點解唔去考 SCS-C02 呢，話晒都係同 Security 直接有關？因為我張免費券無包 Profesional，要自己比 300 USD 好貴的。

## 我打宿儺？

嗰陣我開始 prepare 嘅時候大概係 8 月頭，諗住之前睇過一次 Cloud Practitioner 會相對簡單，一個月已經足夠。當我打開  A Cloud Guru 開始睇課程嘅時候，發現網上課程要睇 60+ hours，一開始仲差啲温錯 SAA-C02。無錯啦喵，AWS 啱啱更新咗 SAA-003，多咗有關 Machine Learning 嘅內容，即係 Amazon Rekognition, Amazon SageMaker 個類嘅物體。

SAA-003 有四大 domain:

- Domain 1: Design Secure Architectures

- Domain 2: Design Resilient Architectures

- Domain 3: Design High-Performing Architectures

- Domain 4: Design Cost-Optimized Architectures

實際上考嘅係 under 不同情況之下應該用邊款 AWS solution。一條題目可能用到 3-4 款，而且有機會每個配置都合理，要配合情景揀最優解。

> ![image3]({{ site.baseurl }}/assets/images/aws-saa/image3.png)
>
> Dobby is free, 多比是免費的
>
> ![image6]({{ site.baseurl }}/assets/images/aws-saa/image6.png)
>
> 每張都可以直接考，SAA-C03 考過就消失
>
> ![image2]({{ site.baseurl }}/assets/images/aws-saa/image2.png)
>
> 去到考個下我都係覺得自己未溫夠書
>
> btw 今個星期宿儺真係瓜咗

## Stage of Study

A Cloud Guru 係一個好幫手嘅 webpage 俾你深入淺出咁去理解每個會考嘅 AWS services。A Cloud Guru 可以幫你達成三件事：

- Lecturing - 聽老師講解 AWS services

- Hands-on lab

- Practice Exam

我每日大概睇兩個鐘頭連續睇三個星期，包括 review take notes。有啲 services 唔理解的話會先睇 Medium 前人解釋，先再睇 AWS official introdution。去到 exam 之前我只係夠時間去聽曬所有 lesson 同做 3 set practice exam。

AWS Skill Builder 上面有 materials，據說官方俾嘅 practical exam 同現實差不多。除咗免費 content 之外，AWS Skill Builder 仲有課金內容。覺得免費唔夠的話可以再課金睇。

## 關於考試

考試可以選擇係 Pearson VUE exam center 或者 Online 考。個人推薦用 online 考，可以有多啲時間唔洗親身去 center。而且非英文母語考生可以 request extra 考試時間，由 140 mins extend 到 170 mins。

Online 考試需要先安裝 Pearson VUE 考試專用 software，開場之前需要用手機 scan QR pair with 電腦嘅 Pearson VUE software，再用手機影身份證同考生座位嘅前後左右。無問題的話 invigilator 會開 mic 同你 confirm，例如要你舉高電腦睇檯面有無其他雜物同 make sure 考試場地係點，郁下電腦 camera。最後考試前要 clean desk 先會開始。

題外話：invigilator 嘅印度口音聽唔掂可以要求用 chatbox 溝通。

## 結語

考試最後我用 139 mins 考，題目有啲長建議睇熟每個 AWS solution 嘅使用方法同特性。雖然唔係好考 low level configuration or setup，但係好考判斷。好似我溫書嘅時候卡咗好耐 Amazon MQ 同 SQS 嘅分別，SQS 自己嘅 standard queue 同 FIFO queue 嘅 limitation 又好大差異。

最後成功低空飛過合格，多謝大家！

> ![image4]({{ site.baseurl }}/assets/images/aws-saa/image4.png)
>
> 結果我無時間睇官方內容...
>
> ![image7]({{ site.baseurl }}/assets/images/aws-saa/image7.png)
>
> 課金之力！
>
> ![image1]({{ site.baseurl }}/assets/images/aws-saa/image1.png)
>
> Pearson VUE exam center 示意圖，香港 exam center 無人直接督促，但係有好多 CCTV 望住
>
> ![image5]({{ site.baseurl }}/assets/images/aws-saa/image5.png)
>
> 如果唔 pass 就唔會見到篇文，你話係咪啊哈姆太郎
>
> ![image8]({{ site.baseurl }}/assets/images/aws-saa/image8.png)
>
> 唔係賣廣告， 玩 AWS BuilderCards 記得唔同 service 用途可以有助溫書
