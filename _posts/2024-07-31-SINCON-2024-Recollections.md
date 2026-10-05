---
layout: post
title: "SINCON 2024 Recollections"
date: 2024-07-31 12:00:00 +0000
slug: "SINCON-2024-Recollections"
tags: [Conference]
---
I was in SINCON 2024 to promote the products of my company. So I was like spending my first 3 days on booth setup and staying around the booth.

## What have I done?

I was given a section to give a talk on any topic. In the end, I tried to explain to the audience how to use NIST Cybersecurity Framework (CSF) and Cyber Defense Matrix (CDM) to check if there are any missing plates for the defense mechanism. Although the content is about ransomware and data leak detection in darkweb, some audience foundmy talk interesting when CDM is infused in my slides.

When I had some spare time not at my booth, I tried to attend the following workshops:

  - Toyota Motor Corporation x Car Security Quarter (CSQ) — Automotive Security 101
  - Introduction to Software Defined Radio (SDR) Workshop

---

## Car Hacking

At the beginning of the session, we were askedto install can-utils on our VM. RAMN and CAN Bus.

As the workshop only has 15 [RAMN](https://ramn.readthedocs.io/en/latest/general.html) (Resistant Automotive Miniature Network) prepared and the workshop was too popular, we had to team up to try playing with it. I was lucky and my teammate let me do all the hands-on parts. Either their environment is not functioning, or they find it more fun to look at others playing with the commands.

![image5]({{ site.baseurl }}/assets/images/sincon-2024-recollections/image5.png)

![image9]({{ site.baseurl }}/assets/images/sincon-2024-recollections/image9.png)

Image of RAMN and its architecture

![image10]({{ site.baseurl }}/assets/images/sincon-2024-recollections/image10.png)

How communication works in a modern vehicle

Source: A classification of attacks to In-Vehicle Components

Car systems nowadays make use of many communication systems that work like neural networks. The main aim of our workshop is to hijack the CAN bus so that the components (e.g. accelerator, brake, turn signals) work in the way the attacker wishes to.

Of course, there are other communication protocols. We are targeting the CAN bus this time.

## Packet Sniffing

cansniffer is used to track down the data and see the data received from RAMN. Items highlighted in red represent an update of value. Note that cansniffer keeps on updating the console. It is impossible for users to track the historical record.

![image7]({{ site.baseurl }}/assets/images/sincon-2024-recollections/image7.png)

candump was used to track the data of CAN Bus. By using the value and mask pair, we can trim the data and have every instance printed line by line on the console.

![image6]({{ site.baseurl }}/assets/images/sincon-2024-recollections/image6.png)

---

## Injection

We capture a handbrake signal as follows:

`(1716453526.483563) can0 1D3 [8] 01 00 8A 75 4A C9 87 35`We attempt to send it back using canbus, trying to pretend as a normal input or even an interception

`cansend can0 1d3#01008A754AC98735`Result: RAMN recognised the handbrake signal and actually braked the car.

![image3]({{ site.baseurl }}/assets/images/sincon-2024-recollections/image3.png)

![image3]({{ site.baseurl }}/assets/images/sincon-2024-recollections/image3.png)

It is also possible to use camplayer to replay a signal capture without knowing which ID represents the exact component action (just packet-by-packet.)

Capture: `candump can0 -f ./can0.log`

Replay: `can player -I ./can0.log -l i can0=can0`

I tried to play with all buttons while capturing the sequences but I forgot to take a video. In short, you may see that the headlight turns on itself by replaying the whole sequence captured from candump.

![image1]({{ site.baseurl }}/assets/images/sincon-2024-recollections/image1.png)

## Demo and CAN Log

If you want to see the video demo and my CAN bus capture, please PM me, and I will share it with you.

## SDR

The SDR workshop mainly covered the following:

  - Wave theory
  - Modulation / Demodulation
  - GNU Radio hands-on

While we were learning the theories, we had to install `gnuradio` at the same time. Speakers also suggested using OS [`PENTOO`](https://pentoo.org/) with boot USB. This allows the hardware to communicate directly and facilitates the use of HackRF One.

An IQ file (I/Q data) was provided in the workshop and we were asked to demodulate it in order to hear the FM broadcast recorded. The IQ files work as a ”raw” file of the signal. Within `gnuradio`, we are able to create “flowgraphs”, which tells `gnuradio` how to process data into a desired format. Once it is completed, it should look like this:

![image8]({{ site.baseurl }}/assets/images/sincon-2024-recollections/image8.png)

You may find it similar to an FM receiver.

![image4]({{ site.baseurl }}/assets/images/sincon-2024-recollections/image4.png)

## Extra

I won the lucky draw from Offensive Security, which is a box of Lego…

![image2]({{ site.baseurl }}/assets/images/sincon-2024-recollections/image2.png)
