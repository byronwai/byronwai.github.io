---
title: "ONIST to hack Kiosk"
date: 2024-10-31 12:00:00 +0000
slug: "ONIST-to-hack-Kiosk"
tags: [Hardware Hacking]
---
### Introduction

Ken Wong and I recently visited a secondary school to conduct cybersecurity workshops. After wrapping up our session, we noticed a food-ordering kiosk in the playground. Naturally, our curiosity kicked in, and we decided to see just how far we could go in exploring the system.

### Attack See Load

The school’s meal services are provided by Chartwells, a Canada-based company.

![image4]({{ site.baseurl }}/assets/images/onist-kiosk/image4.png)

With a bit of trial and error, we managed to access the kiosk’s password page. At first, we thought tapping a specific corner of the screen a few times might trigger the prompt—and it did! But we couldn’t quite replicate the process consistently. Still, we were in.

Now, the million-dollar question: **What’s the password?**

![image1]({{ site.baseurl }}/assets/images/onist-kiosk/image1.png)

We tried the usual suspects: 00000 (all zeros), 123456, and even Chartwells' phone number.  No luck. So, we dug deeper. It turns out the kiosk wasn’t directly managed by Chartwells but by another company: EBSPOS. Time to consult Google!

![image5]({{ site.baseurl }}/assets/images/onist-kiosk/image5.png)

While Googling, we stumbled upon a log file. Wait—what’s this? The log contains the password, and it’s searchable on Google? Seriously? The password was 328118. By the time we tried to revisit the log, it had been taken down. But it was too late—we had what we needed. We entered the password and accessed the admin page. Success! Or so we thought…

![image6]({{ site.baseurl }}/assets/images/onist-kiosk/image6.png)

The admin page was underwhelming. It had only two options: check your Octopus balance and view food order records. Not exactly the treasure trove of vulnerabilities we were hoping for.

![image2]({{ site.baseurl }}/assets/images/onist-kiosk/image2.png)

![image3]({{ site.baseurl }}/assets/images/onist-kiosk/image3.png)

### Root cause and more?

![image7]({{ site.baseurl }}/assets/images/onist-kiosk/image7.png)

The page had been cached by the Wayback Machine. Even worse, it looked like directory listing was enabled at some point! Seriously, who still allows directory listing in 2024?

To make matters worse, we discovered that some students had figured out a clever loophole. Ken Wong interviewed some students and they talked about the loophole. They realized they could use both their **receipt** and their **student card** to collect a meal—essentially allowing them to "double spend" the same transaction. In other words, they could pay once but get two meals.

Talk about an unintended **buy-one-get-one-free** deal!
