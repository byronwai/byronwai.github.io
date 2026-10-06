---
title: "noVNC with clipboard"
date: 2022-11-14 12:00:00 +0000
slug: "novnc-with-clipboard"
tags: [Linux]
---

Follow this:
<https://www.kali.org/docs/general-use/novnc-kali-in-browser/>

```bash
# Disbale firewall
sudo apt install ufw
sudo ufw disable

# (Optional) Enable SSH
## sudo systemctl enable ssh --now

# Install VNC server and VNC on browser
sudo apt install -y novnc x11vnc

# Install clipboard feature
sudo apt install -y autocutsel

sudo cat <<_EOF_ > ~/.vnc/xstartup
#!/bin/sh

xrdb $HOME/.Xresources
# -solid grey gaves us a real mouse pointer instead of the default X
xsetroot -solid grey -cursor_name left_ptr
# Allow copy & paste when ClientCutText is set to true on the client side
autocutsel -fork

export XKL_XMODMAP_DISABLE=1
/etc/X11/Xsession
_EOF_

# Start VNC, remove flag -ncache
x11vnc -display :0 -autoport -localhost -nopw -bg -xkb -ncache_cr -quiet -forever

# Start noVNC (broswer)
/usr/share/novnc/utils/launch.sh --listen 8081 --vnc localhost:5900
```
