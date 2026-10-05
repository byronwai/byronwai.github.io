---
layout: post
title: "Fun in DEFCON 33"
date: 2025-09-30 12:00:00 +0000
slug: "Fun-in-DEFCON-33"
tags: [Conference]
---

### Prologue

Thanks to the Loong community for bringing me to the DEFCON33 party. I enjoyed the time that I spent in Las Vegas (mostly), and you will know why.

### DEF CON 33

#### Loong Community Helper

Unlike other villages that focus on a specific topic, we as a community offer various themes (and of course, hardware) for audiences to play with.

![image11]({{ site.baseurl }}/assets/images/defcon-33/image11.png)

(Too lazy to type what we share, check out <https://defcon.org/html/defcon-33/dc-33-communities.html#orga_41049>)

Our (Boris, Eliza, Hebe, and me) booth(s) mainly talks about SDR (software-defined radio) and network pentest tools. Yes, I know Cynthia is for testing USB devices, but don’t argue with me.

**Preparation work**

What we didn’t demo:

- RF Explorer H Loop

Connect with HackRF to capture the radio waves that a chip emits, side-channeling. However, we didn’t have target chips (or a motherboard) to side-channel with.

![image14]({{ site.baseurl }}/assets/images/defcon-33/image14.png)

- Screen Crab
A tool that captures the HDMI signal and saves it in an SD card or cloud server(Hak cloud C2).
The main issue is that we run out of monitors for capturing, and we can’t connect to Wi-Fi for sending images back to the C2 server. It is more complicated to demo if the C2 server cannot be used.

![image15]({{ site.baseurl }}/assets/images/defcon-33/image15.png)

No HDMI mirrored feature is provided

See if we can arrange a demo for these gadgets.

The preparation work is not hard, except for getting all the dependencies, having the cables, and deciding what to demo. For example, we never know that Kraken SDR works only on Linux. We have to buy a Raspberry Pi 5 just before our flight for the Kraken SDR demo. Also, we will have to design what kind of network traffic we can use to demonstrate the network tap.

**D-Day**

In a spin.

Basically, I just have to set up the SDR part. But we run out of sockets, even with power strips. What’s more, the USB cables are a bit too short. I should bring 10 3-meter USB-Type C cables, or even power cord reels.

Back to my SDR part, RTL-SDR and HackRF are easy to set up, sweet and simple. I can pull up a waterfall diagram and leave it alone. It will illustrate and visualize the radio waves at the desired frequency.

![image6]({{ site.baseurl }}/assets/images/defcon-33/image6.png)

Example of a waterfall diagram

For the first day, it is really tired and I don’t have time to walk around. I also don’t have time to figure out how Kraken SDR works. But I’m lucky enough to set it up on the remaining days. Please, Raspberry Pi 5, don’t use a weird 5.1V 5A standard. I can’t use any PD charger (at all) without power throttle.

SignalSDR Pro?

![image7]({{ site.baseurl }}/assets/images/defcon-33/image7.png)

#### As Human (aka attendee)

DEF CON uses “human” to represent a normal attendee, and I keep this word here.

![image13]({{ site.baseurl }}/assets/images/defcon-33/image13.png)

Image from badge designer @spuxo

DEF CON holds in Las Vegas Convention Center West Hall, using all the 3 stories (floors) for villages and talk. I didn’t attend any talks in DEF CON as I’m more interested in villages. Some of the talks are available in both Black Hat USA and DEF CON, so I don’t have a strong intention to join the talks (again).

There are 2-3 booths that I was impressed:

**Aerospace Village**

<https://www.aerospacevillage.org/def-con-33/def-con-33-activites>

I come to here looking for activities that are related to both cybersecurity and satellites. And “Automated security assessment for CCSDS protocols” presented by GMO Cybersecurity attracts my eyeballs.

They claimed that it is a simulation of attacking the communication protocol of a satellite. I was worried that a simulation of the protocol is far from reality. However, [CCSDS](https://www.nasa.gov/directorates/somd/space-communications-navigation-program/data-standards/) is an open source protocol that NASA is also using. This is good enough to convince me to have a high chance of having the attack performed in real life. In short, it is similar to Hack-A-Sat.

![image9]({{ site.baseurl }}/assets/images/defcon-33/image9.jpg)

![image3]({{ site.baseurl }}/assets/images/defcon-33/image3.jpg)

Attack Scenerio including unencrypted RF, ECB leakage, and length-mismatch overflow

---

**Red Alert**

ICS CTF, playing with smart city infrastructure. It provides a bunch of operational technology devices for audiences to attack with.

![image17]({{ site.baseurl }}/assets/images/defcon-33/image17.jpg)

![image16]({{ site.baseurl }}/assets/images/defcon-33/image16.jpg)

A cabinet with locks  for players to attack

Mainpoint: Best of the Best.

<https://www.youtube.com/shorts/AMA6e_oyEH8>

**Tamper-Evident Village**

They give you a bunch of used cable ties and ask you to untie them. Also, to remove stickers from parcels without damaging them.

![image12]({{ site.baseurl }}/assets/images/defcon-33/image12.jpg)

**Maritime Hacking Village**

They got a boat, for real.

![image1]({{ site.baseurl }}/assets/images/defcon-33/image1.jpg)

They got a panel board, for real. It’s also a challenge.

![image10]({{ site.baseurl }}/assets/images/defcon-33/image10.jpg)

I forgot, but it should be a demo of I2C protocol analysis.

![image2]({{ site.baseurl }}/assets/images/defcon-33/image2.jpg)

**Car Hacking Village**

Got a car, for real. But can’t take it home. I was thinking if you can perform an attack via CAN protocol, but they offer an Ethernet cable for initial access.

![image18]({{ site.baseurl }}/assets/images/defcon-33/image18.jpg)

#### Wrong way to attend DC33

Most villages will have their own schedules for talks and demonstrations. If you missed that time slot, you will probably see a bunch of guys staying at the booth for attempting the challenges. But having CTF or challenges is a part of DEFCON.

There are some of the villages that I am interested in, including lock picking and radio frequency villages. It is so stealthy, and I missed that area. So always read the map beforehand.

![image5]({{ site.baseurl }}/assets/images/defcon-33/image5.png)

#### MISC

Nearly missed the PHRACK magazine. They require us to either tell them a fun fact or answer a question to get one.

![image8]({{ site.baseurl }}/assets/images/defcon-33/image8.jpg)

**Epilogue**

Fun. I have enough experience to join DEFCON 34 in a correct way now.

![image4]({{ site.baseurl }}/assets/images/defcon-33/image4.png)

Photo of my badge being stolen after an hour of purchasing it
