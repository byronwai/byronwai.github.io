---
title: "LDAP Setup"
date: 2018-09-30 15:11:23 +0000
slug: "ldap-setup"
tags: [AD, LDAP]
---

### 0. 前言

由於server上要使用Windows login crediential來登入server，以此紀錄設定過程。  
參考[MSDN](https://blogs.msdn.microsoft.com/microsoftrservertigerteam/2017/04/10/step-by-step-guide-to-setup-ldaps-on-windows-server/)卻ldap_bind failed，一氣之下寫下過程。  
OS: Windows 2012 R2  
PHP: IIS 8

### 1. Enable Active Directory Domain Service

到 Server Manager -> Manage -> Add Roles and Features，按下圖enable Active Directory Domain Services就可。

![image1]({{ site.baseurl }}/assets/images/20180930/image1.png)  
![image2]({{ site.baseurl }}/assets/images/20180930/image2.png)  
![image3]({{ site.baseurl }}/assets/images/20180930/image3.png)  
![image4]({{ site.baseurl }}/assets/images/20180930/image4.png)  
![image5]({{ site.baseurl }}/assets/images/20180930/image5.png)  
![image6]({{ site.baseurl }}/assets/images/20180930/image6.png)  
![image7]({{ site.baseurl }}/assets/images/20180930/image7.png)  
![image8]({{ site.baseurl }}/assets/images/20180930/image8.png)  
![image9]({{ site.baseurl }}/assets/images/20180930/image9.png)  
![image10]({{ site.baseurl }}/assets/images/20180930/image10.png)  
![image11]({{ site.baseurl }}/assets/images/20180930/image11.png)

AD DS安裝完成後回到Server Manager->AD DS進行設置，Click “More…”  
![image12]({{ site.baseurl }}/assets/images/20180930/image12.png)

接著按 “Promote this server to a domain…”  
![image13]({{ site.baseurl }}/assets/images/20180930/image13.png)

在此我選擇Add a new forent。  
由於沒有domain name，我使用一個local domain name，稍後時間其他server DNS指回AD便可access domain  
![image14]({{ site.baseurl }}/assets/images/20180930/image14.png)

Server Version在此我選擇 Windows 2012 R2，請按照實際需要選擇。

![image15]({{ site.baseurl }}/assets/images/20180930/image15.png)  
![image16]({{ site.baseurl }}/assets/images/20180930/image16.png)  
![image17]({{ site.baseurl }}/assets/images/20180930/image17.png)  
![image18]({{ site.baseurl }}/assets/images/20180930/image18.png)  
![image19]({{ site.baseurl }}/assets/images/20180930/image19.png)

“View Script” 檢查設定

![image20]({{ site.baseurl }}/assets/images/20180930/image20.png)

如果Prerequest Check沒過的話，請按照提示修正

![image21]({{ site.baseurl }}/assets/images/20180930/image21.png)  
![image22]({{ site.baseurl }}/assets/images/20180930/image22.png)

安裝完成後需要重新啟動

![image23]({{ site.baseurl }}/assets/images/20180930/image23.png)

重新登入後便可使用Domain Account登入

![image24]({{ site.baseurl }}/assets/images/20180930/image24.png)

### 2. Add New User

由於Domain上增加使用者方式與一般有差異，一並紀錄。

Server Manager -> Manage -> Active Directory Users and Computers  
如果沒有發現，可以參考[Microsoft的教學](https://social.technet.microsoft.com/Forums/windows/en-US/06b889c9-0c2b-4485-9d20-c5058de65a11/remote-server-administration-tools-for-windows-10-active-directory-users-and-computers-missing?forum=win10itprogeneral)

找到自己domain name後到Users，Right Click

![image25]({{ site.baseurl }}/assets/images/20180930/image25.png)

在此新增一個叫”sardine”的使用者，密碼為”Crack_me”，稍後進行LDAP bind測試。

![image26]({{ site.baseurl }}/assets/images/20180930/image26.png)  
![image27]({{ site.baseurl }}/assets/images/20180930/image27.png)  
![image28]({{ site.baseurl }}/assets/images/20180930/image28.png)

新增成功後看到使用者”sardine”

![image29]({{ site.baseurl }}/assets/images/20180930/image29.png)

### 3. Enable Active Directory Lightweight Directory Servives

Server Manager -> Manage -> Add Roles and Features

![image31]({{ site.baseurl }}/assets/images/20180930/image31.png)  
![image32]({{ site.baseurl }}/assets/images/20180930/image32.png)  
![image33]({{ site.baseurl }}/assets/images/20180930/image33.png)  
![image34]({{ site.baseurl }}/assets/images/20180930/image34.png)  
![image35]({{ site.baseurl }}/assets/images/20180930/image35.png)

安裝完成後進行設置

![image36]({{ site.baseurl }}/assets/images/20180930/image36.png)  
![image37]({{ site.baseurl }}/assets/images/20180930/image37.png)

Setup wizard稍後時間也可在Windows中找到

![image38]({{ site.baseurl }}/assets/images/20180930/image38.png)  
![image39]({{ site.baseurl }}/assets/images/20180930/image39.png)

Instance name名字可以自己取耶  
Port Number可以自己改，Default該是389，可是389被其他service占用，Windows自動配置Port 50000

![image40]({{ site.baseurl }}/assets/images/20180930/image40.png)  
![image41]({{ site.baseurl }}/assets/images/20180930/image41.png)

Partition的配置我不太肯定，我自己的設定為CN=Instance, DN=Domain

![image42]({{ site.baseurl }}/assets/images/20180930/image42.png)  
![image43]({{ site.baseurl }}/assets/images/20180930/image43.png)

繼續按Default配置

![image44]({{ site.baseurl }}/assets/images/20180930/image44.png)  
![image45]({{ site.baseurl }}/assets/images/20180930/image45.png)

選擇所有LDFI

![image46]({{ site.baseurl }}/assets/images/20180930/image46.png)

Double Check

![image47]({{ site.baseurl }}/assets/images/20180930/image47.png)

Install

![image48]({{ site.baseurl }}/assets/images/20180930/image48.png)  
![image49]({{ site.baseurl }}/assets/images/20180930/image49.png)

最後在自己host上掛上testing PHP script，在 [php.net](http://php.net/manual/en/function.ldap-bind.php) 上可以找到  
PHP server setup我自己使用IIS，設置按下不表。

測試成功

![image50]({{ site.baseurl }}/assets/images/20180930/image50.png)
