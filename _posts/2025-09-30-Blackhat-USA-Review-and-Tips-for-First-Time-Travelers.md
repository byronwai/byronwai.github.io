---
layout: post
title: "Blackhat USA - Review and Tips for First-Time Travelers"
date: 2025-09-30 12:00:00 +0000
slug: "Blackhat-USA-Review-and-Tips-for-First-Time-Travelers"
tags: [Conference]
---

### Prologue

Lucky enough to join Black Hat USA and DEF CON 33 this year. And yes, this is my first time joining both conferences. It is an eye-opening experience that allows me to understand what some of the best conferences should look like.

As my fellows should focus more on the technical side, I can write more about my experience and thoughts.

And yes, I missed the chance to attend BSides LV due to a time conflict. 🫠

### Black Hat USA (BHUSA)

I have varied interests that may not be related to my profession. You will see I hopped into different areas for my interest.

![image3]({{ site.baseurl }}/assets/images/blackhat-usa-travel-tips/image3.jpg)

Random photo taken before the start of BHUSA

#### Briefing

Briefing means a talk in BHUSA. I will specifically use the word “briefing” for BHUSA, as this is their official wording.

List of briefings I joined:

- Watching the Watchers: Exploring and Testing Defenses of Anti-Cheat Systems
- Back to the Future: Hacking and Securing Connection-based OAuth Architectures in Agentic AI and Integration Platforms
- From Spoofing to Tunneling: New Red Team's Networking Techniques for Initial Access and Evasion (HITCON)
- Shade BIOS: Unleashing the Full Stealth of UEFI Malware
- Burning, Trashing, Spacecraft Crashing: A Collection of Vulnerabilities That Will End Your Space Mission
- Booting into Breaches: Hunting Windows SecureBoot's Remote Attack Surfaces
- Firewalls Under Fire: China's 5+ Year Campaign to Penetrate Perimeter Network Defenses
- FACADE: High-Precision Insider Threat Detection Using Contrastive Learning
- Uncovering 'NASty' 5G Baseband Vulnerabilities through Dependency-Aware Fuzzing
- Watch Your (Lock)Step: Glitching into Automotive Processors
- Behind the Screen: Unmasking North Korean IT Workers' Operations and Infrastructure

But you will lose your attention soon if you join a talk in every session. Joining 3-4 briefings per day can keep you on track. I will also suggest checking out briefings that are not available on demand. Most of the briefings will be recorded and can be watched online.

I will cherry-pick some of the talks above and give a summary. If you didn’t see my review of the talk, it should be too hard for me to figure out the details before the end of BHUSA. 🫠

**Watching the Watchers: Exploring and Testing Defenses of Anti-Cheat Systems**

This talk mainly gives an introduction to how game cheating is performed on PC and how cheating can be detected or defended. It basically covers the cheat ecosystem and market

Hoking APIs are too common. The most interesting part to me are BYOVD (Bring Your Own Vulnerable Driver) and DMA. BYOVD means the attacker can use their driver signed by Microsoft (WHQL) and pretend itself as a legit driver. The driver can abuse kernel privileges. For more details on BYOVD, please refer to “[潛入核心：](https://s.itho.me/ccms_slides/2023/5/18/b37bcba9-bc6e-4cdd-a5d0-de48c15570ac.pdf)

[惡意程式與驅動程式的狼狽為奸](https://s.itho.me/ccms_slides/2023/5/18/b37bcba9-bc6e-4cdd-a5d0-de48c15570ac.pdf)” and “[現代內核漏洞戰爭 - 越過所有核心防線的系統/晶片虛實混合戰法](https://hitcon.org/2023/CMT/slide/現代內核漏洞戰爭 - 越過所有核心防線的系統_晶片虛實混合戰法.pdf)”. You may discover that BYOVD developed in cheat and anti-cheat before it is used by malware. For the defense of BYOVD, Load Time Prevention and Run Time Detection can be used.

For DMA (Direct Memory Access), rogue hardware is allowed to access memory via PCIe channel. An example will be [Thunderclap](https://thunderclap.io/), using the Thunderbolt port to execute arbitrary code. In reality, game cheating will involve 2 PCs. A PC that runs the game with DMA card in PCIe slot, and a separate PC to run the cheat based on DMA card data. For detecting DMA attacks, it will be possible to request hardware to perform tasks as it claims to be. For example, it should be able to perform networking if it is a network card.

When I dug a bit deeper in game cheating, I found a technology named HMTT, which acts as a MitM for memory to access the RAM directly for game cheating. No wonder the presenter mentioned that the safest state of your computer is when you are playing games with anti-cheat on.

**Back to the Future: Hacking and Securing Connection-based OAuth Architectures in Agentic AI and Integration Platforms**

I am joining this talk as I accidentally found one of my friends to be a presenter. However, he was not in the US.

OAuth has been used for authentication for a while, and it is not a new protocol. However, Agentic AI (agent) relies on OAuth has new attack surfaces, including cross-user, cross-agent. and cross-tool a ack scenarios. These kind of attacks was also found available on platforms provided by big tech firms e.g. Microsoft. Does it mean that it opened up an easy way to discover CVEs?

**From Spoofing to Tunneling: New Red Team's Networking Techniques for Initial Access and Evasion**

This session is fun as it demonstrates a way to intrude into systems without an external IP. However, I attended this talk at HITCON due to a time conflict in BHUSA. The review will be put in my HITCON review (if I have time).

**Shade BIOS: Unleashing the Full Stealth of UEFI Malware**

This talk introduces what BIOS malware is and the difficulties that current BIOS (also UEFI) malware will encounter. For example, a legacy BIOS malware can only attack a particular target. Some of the UEFI malware will rely on the OS and perform malicious activities in the userland or kernel. In other words, modern UEFI malware suffers from OS and hardware dependencies. Either the BIOS malware can enjoy the high privilege that BIOS brings but lacks of abstract interface, or use the OS features but is easily detected by EDR or requires bypassing OS-level security.

To solve the issues, the author developed Shade BIOS.  Shade BIOS allows him to:

1. Retain BIOS after booting to OS
1. Make the retained BIOS code work properly in runtime

This brings both the advantages of using the high privilege BIOS that comes with it, and being OS independent.

BIOS in memory will be removed from memory after the OS boots. To retain the BIOS, the author hooks `gBS->GetMemoryMap()` in DexCore and changes BootServices to RuntimeServices type.

Speaking of the boot process of UEFI, it has several stages. Below is an [illustration](https://learn.microsoft.com/en-us/answers/questions/2610552/uefi-secure-boot-in-windows-8-1)of how Windows 8.1 boots.

![image1]({{ site.baseurl }}/assets/images/blackhat-usa-travel-tips/image1.png)

During the DXE phase, device drivers and advanced firmware modules are loaded, enabling comprehensive system initialization needed before operating system handoff. The DXE phase is the core stage where most hardware and platform components are set up, establishing all necessary services for consoles, boot devices, and runtime protocols to prepare the system for the subsequent booting of an operating system. Explaining why the author will retain BIOS using DexCore.

**Burning, Trashing, Spacecraft Crashing: A Collection of Vulnerabilities That Will End Your Space Mission**

I arrived in the middle of the talk, so I missed the first part of it. The main message is that space missions are a complicated project and a matter of life and death. The component should be safe enough, but a couple of open-source dependencies are found with critical vulnerabilities, e.g., XSS and hard-coded credentials. The open source project was found with vulnerabilities, and it has an even higher chance of having vulnerabilities for a closed source project.

Space is hard, but space security is not.

**Booting into Breaches: Hunting Windows SecureBoot's Remote Attack Surfaces**

This is literally too hard for me. If you see a male speaker using an anime-like avatar, you will immediately know he is an expert, just like this talk. You should also join this talk because of CyberKunlun.

In short, the talk reveals a way to attack the secure boot with a bootloader. The network boot to user-mode is not defensible. The author also introduces different fuzzers to discover bugs in the bootloader.

**Firewalls Under Fire: China's 5+ Year Campaign to Penetrate Perimeter Network Defenses**

It’s a storytelling talk to explain how a massive number of Sopho’s firewall was attacked by a 1-day (CVE-2020-12271) named Asnarök.

[Here](https://news.sophos.com/en-us/2020/04/26/asnarok/)is the article written by the speaker in 2020 for a more technical perspective on how this attack is performed and the list of indicators of compromise (IOCs) for checking.

The talk also mentioned how the attacker (GbigMao) was being discovered, including but not limited to email registration with his handle, geolocation of other Sopho’s CVEs reported, and the use of VPN. I remember that the speaker mentioned that Hong Kong is one of the “springboard” of VPN servers, but I can’t find the details in the slides.

But the speaker didn’t mention that GbigMao was [not being paid](https://www.rfa.org/cantonese/news/us-hacker-fbi-wanted-chinese-guan-tianfeng-01022025145904.html) after launching this massive-scale attack. He literally went to sue his company to get his pay back.

**FACADE: High-Precision Insider Threat Detection Using Contrastive Learning**

Paper [here](https://arxiv.org/pdf/2412.06700). Google developed a tool named FACADE for detecting insiders based on user behavior. They mentioned that its nearly impossible to cover all attack surfaces and develop detection rules. Google uses event and context for their detection model. Event is the principal (user) accessing a resource at a point of time, where context is computed from principal’s profile and its social interactions.

![image2]({{ site.baseurl }}/assets/images/blackhat-usa-travel-tips/image2.png)

However, I am not that into the machine learning part, but how the model is implemented. Turns out that FACADE is highly coupled with Google’s own component. The sample data in TFRecord is provided to try out FACADE. I am quite disappointed as it is a showcase of ML model, but not a concrete tool for users to try out on their own logs. The [repository](https://github.com/google/facade) is provided but the team does not guarantee to have updates or support. I would appreciate it if they could tell us what the required format and field are for the log.

**Uncovering 'NASty' 5G Baseband Vulnerabilities through Dependency-Aware Fuzzing**

Before the start of the talk, let me [borrow the definition](https://www.5gtechnologyworld.com/what-is-the-5g-protocol-stack/) of NAS.

The Radio Resource Control (RRC) layer supports and manages the establishment, maintenance, and release of the radio connection between the user devices and the base station, including tasks like connection setup, mobility management, and control signaling for handovers.

The non-Access Stratum (NAS) layer supports the signaling and management of non-radio access-related functions, including network registration, authentication, security, and mobility management.

After listening to the talk, the main messages I got are:

1. How to bypass security check in NAS using a message named “!!FAKE-TESTHARNESS!!”
1. Symbolic execution consumes a lot of RAM for emulating Samsung’s 5G Shannon Basebands. It requires a TB level of memory to emulate and perform symbolic execution on just a part of the smartphone firmware.

At least I see a PoC to send an OTA message from a self-hosted 5G station (Open5GS with USRP) to crash the smartphone basebands.

**Watch Your (Lock)Step: Glitching into Automotive Processors**

I love this one for both the content and the way the speaker presents.

For a normal car hacking, they will teach you how to attack the ECU. However, this one talks more about how we can, and why we should glitch the CPU (processors) of vehicles.

ASIL (automotive safety integrity level) classifies the different components in a vehicle by their harmfulness when they malfunction, rated with Severity, Exposure (Likelihood), and Controllability. Noted that ASIL-D is the highest.

![image7]({{ site.baseurl }}/assets/images/blackhat-usa-travel-tips/image7.png)

Undoubtedly, the processor belongs to ASIL-D. Components that fall into ASIL-D shall be able to detect or otherwise control hardware faults within a fault-tolerant time interval.

A lockstep processor has a master core and a checker core to compare if the same result is obtained from an identical instruction. However, the processor is still vulnerable to fault injection by a voltage dip by draining the capacitors, or EMFI (Electromagnetic Fault Injection). By using the fault injector the speaker developed, he is able to crack the debug password of some of the lockstep processors and perform a (relatively) quick check and see if the processor has its debug port opened. Enabling the debug port allows him to dump and modify the firmware of devices that use the lockstep processor.

The speaker left some words on Nintendo Switch 2, as they also use lockstep processors. I will also be curious if this kind of attack works on game consoles.

But I didn’t find their Glitching Lab in DEFCON embedded systems village. 😔

**Behind the Screen: Unmasking North Korean IT Workers' Operations and Infrastructure**

Once again, the speaker uses an anime-like avatar.

The last talk I picked is a talk not available on demand, aka no VAR. You can prove me wrong, right?

The speaker showcases some of the software and tools that North Korean (DPRK)  IT workers are using. For example, they use Slack as the main communication software. He also performs analysis on the “special” linguistic structure that these DPRK works use for their cover letter, like the use of emojis and symbols, excessive use of exclamation marks, and mixed use of languages.

Speaking of the Slack channel, apart from the chit-chat (social) channel, messages like seeking fake ID cards, and AnyDesk credentials of the laptop farms are also found. However, the speaker found it weird that the laptop farms are in Ukraine, even after the Russian invasion of Ukraine. DPRK joins the alliance of Russia and sends army to Ukraine, but laptop farms are used in Ukraine for earning foreign currency. This is a bit contradictory.

For the interesting side, apart from the talent pipeline the speaker share, we can see that Hong Kong is always one of the springboards for internet connection, including for DPRK.

![image6]({{ site.baseurl }}/assets/images/blackhat-usa-travel-tips/image6.png)

#### Business Booth & Arsenal

You do not need a pass to visit this part. I received a whole luggage (exaggerated) of swags. Although the swags and toys are fun, I also receive a lot of emails from the vendors.

![image8]({{ site.baseurl }}/assets/images/blackhat-usa-travel-tips/image8.jpg)

Random stuff that are not for sale, just an empty box

Arsenal is a place for developers to showcase and demo their tools. I didn’t spend a lot of time on Arsenal, but it's worth taking a look. Especially when you are too tired for the briefing session.

#### Food

It's not about good or bad, but wrong. But I love the desserts, at least. The food court with Asian cuisine is even better than the regular meal. But the boba milk tea tastes perfect, which tastes the same as Hong Kong milk tea.

![image4]({{ site.baseurl }}/assets/images/blackhat-usa-travel-tips/image4.jpg)

Food that I ate in Day 1

![image5]({{ site.baseurl }}/assets/images/blackhat-usa-travel-tips/image5.jpg)

Yes, they have soya for Day 2

#### Epilogue

Great time in BHUSA as I just need to enjoy the talks. However, it is not quite possible to go 0x0G right after the end of BHUSA.

It's also interesting that I also met HITCON members in BHUSA as I wore the HITCON T-shirt on Day 2. Maybe I should wear Ken Wong T-shirt next time?
