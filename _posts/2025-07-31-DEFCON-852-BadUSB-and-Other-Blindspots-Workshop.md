---
layout: post
title: "DEFCON 852 - BadUSB and Other Blindspots Workshop"
date: 2025-07-31 12:00:00 +0000
slug: "DEFCON-852-BadUSB-and-Other-Blindspots-Workshop"
tags: [BadUSB, Workshop]
---

Recently, I have been invited to join a local security community, Defcon Group Hong Kong (DC852), for a BadUSB workshop. It is an interesting workshop and I have sharpened my soldering skills.

### About Workshop

The workshop aims to demonstrate how an attacker can gain control over your device using a USB device or USB cable.

Participants will be provided with:

- A soldering iron set
- Cables
- A USB mouse
- A USB Ninja Module (a microchip)

During the workshop, you will insert the USB Ninja Module between the USB mouse and the host device (in this case, a computer). In essence, the USB Ninja Module will perform a Man-in-the-Middle (MitM) attack.

![image11]({{ site.baseurl }}/assets/images/defcon-852-badusb-workshop/image11.png)

Diagram of  how USBNinja Module should be placed

### About BadUSB / USB Ninja Module

BadUSB generally refers to devices that simulate Human Input Interface (HID) devices to carry out attacks. Back in 2010, Hak5 founder Darren Kitchen originally wanted to use Keystroke Injection to automate some repetitive and mundane tasks[^1].

Since BadUSB mimics human typing and executes attacks using self-written payloads, there isn’t a direct malware payload stored on the computer itself, which makes detection more difficult.

Generally speaking, a BadUSB device is programmed to have a single payload. Attackers will have to remove the BadUSB from the victim for script updating or flashing the ROM.

However, USB Ninja Module comes with a remote controller and software to update the attack payload remotely. It is also possible to send out a payload in real time with software.

![image3]({{ site.baseurl }}/assets/images/defcon-852-badusb-workshop/image3.png)

Software for controlling and updating USB Ninja Module

![image1]({{ site.baseurl }}/assets/images/defcon-852-badusb-workshop/image1.png)

The USB Ninja Module is highlighted in orange

### About USB 2.0

As mentioned, the USB Ninja Module adapter performs MitM between USB Device and Host. It has 4 pins on left and 4 pins on right, for intercepting VCC,  Data+ (D+), Data- (D-), GND.

VCC and GND are used for the power supply.

![image8]({{ site.baseurl }}/assets/images/defcon-852-badusb-workshop/image8.png)

While the D+,  D- are 2 complementary signals. Meaning that their voltage representation is inverted. The method is called differential signalling, and it provides for a high degree of noise immunity.

Nonreturn-To-Zero-Inverted (NRZI) encoding is used by USB. The flipping of polarity represents 0, while keeping the polarity represents 1.

![image4]({{ site.baseurl }}/assets/images/defcon-852-badusb-workshop/image4.png)

### Back to my soldering

I have to disassemble the mouse and remove all 4 cables from the mouse。

![image6]({{ site.baseurl }}/assets/images/defcon-852-badusb-workshop/image6.png)

![image5]({{ site.baseurl }}/assets/images/defcon-852-badusb-workshop/image5.png)

And tried to solder the adapter to the mouse. Of course, we use some additional cables.

![image7]({{ site.baseurl }}/assets/images/defcon-852-badusb-workshop/image7.png)

With a bit of luck and magic, I managed to put all the pieces together.

![image9]({{ site.baseurl }}/assets/images/defcon-852-badusb-workshop/image9.png)

It also works with the control to launch attack.

![image2]({{ site.baseurl }}/assets/images/defcon-852-badusb-workshop/image2.png)

With some BadUSB development experience, I tried to borrow the Digispark [keylogger script](https://github.com/daniel-debrun/Digispark-Keylogger/blob/main/Keylogger.bat)[^2] to make a keylogger. Corresponding modification is made, but it is not successful.

![image10]({{ site.baseurl }}/assets/images/defcon-852-badusb-workshop/image10.png)

I would like to thank the DC852 organizers for organizing the activity. Please follow their LinkedIn (<https://www.linkedin.com/company/dc852/posts/>) for more updates.

P.S. I’m still waiting for the research and demo of Bash Bunny.

---

[^1]: https://docs.hak5.org/hak5-usb-rubber-ducky

[^2]: https://github.com/daniel-debrun/Digispark-Keylogger/blob/main/Keylogger.bat
