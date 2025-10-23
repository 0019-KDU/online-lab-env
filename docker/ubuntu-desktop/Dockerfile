# Lightweight Ubuntu Desktop with noVNC (Web Browser Access)
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC
ENV DISPLAY=:1
ENV VNC_PORT=5901
ENV NO_VNC_PORT=6080

# Install XFCE desktop, VNC server, and noVNC
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      xfce4 xfce4-terminal \
      x11vnc xvfb \
      novnc websockify net-tools \
      dbus-x11 \
      sudo \
      vim nano \
      firefox \
      git curl wget \
      ca-certificates \
      python3 \
      ubuntu-wallpapers \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create user
RUN useradd -m -s /bin/bash student && \
    echo "student:student" | chpasswd && \
    usermod -aG sudo student && \
    echo "student ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Setup x11vnc WITHOUT password (remove password requirement)
RUN mkdir -p /home/student/.vnc && \
    chown -R student:student /home/student

# Set Ubuntu wallpaper
RUN mkdir -p /home/student/.config/xfce4/xfconf/xfce-perchannel-xml && \
    echo '<?xml version="1.0" encoding="UTF-8"?>\n\
<channel name="xfce4-desktop" version="1.0">\n\
  <property name="backdrop" type="empty">\n\
    <property name="screen0" type="empty">\n\
      <property name="monitor0" type="empty">\n\
        <property name="workspace0" type="empty">\n\
          <property name="color-style" type="int" value="0"/>\n\
          <property name="image-style" type="int" value="5"/>\n\
          <property name="last-image" type="string" value="/usr/share/backgrounds/warty-final-ubuntu.png"/>\n\
        </property>\n\
      </property>\n\
    </property>\n\
  </property>\n\
</channel>' > /home/student/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-desktop.xml && \
    chown -R student:student /home/student/.config

# Create Firefox and Terminal shortcuts on desktop
RUN mkdir -p /home/student/Desktop && \
    echo '[Desktop Entry]\n\
Version=1.0\n\
Type=Application\n\
Name=Firefox Web Browser\n\
Icon=firefox\n\
Exec=firefox\n\
Categories=Network;WebBrowser;\n\
Terminal=false' > /home/student/Desktop/firefox.desktop && \
    echo '[Desktop Entry]\n\
Version=1.0\n\
Type=Application\n\
Name=Terminal\n\
Icon=utilities-terminal\n\
Exec=xfce4-terminal\n\
Categories=System;TerminalEmulator;\n\
Terminal=false' > /home/student/Desktop/terminal.desktop && \
    chmod +x /home/student/Desktop/*.desktop && \
    chown -R student:student /home/student/Desktop

# Create startup script for XFCE (NO PASSWORD)
RUN echo '#!/bin/bash\n\
# Fix permissions for PVC-mounted home directory\n\
sudo chown -R student:student /home/student 2>/dev/null || true\n\
mkdir -p /home/student/.config /home/student/.cache /home/student/Desktop /home/student/.vnc\n\
export DISPLAY=:1\n\
Xvfb :1 -screen 0 1920x1080x24 &\n\
sleep 2\n\
export DISPLAY=:1\n\
startxfce4 &\n\
sleep 3\n\
x11vnc -display :1 -forever -shared -nopw -rfbport 5901 &\n\
sleep 2\n\
websockify --web=/usr/share/novnc 6080 localhost:5901 &\n\
echo "========================================"\n\
echo "✅ Desktop Ready!"\n\
echo "========================================"\n\
echo "🌐 Open: http://YOUR_IP:6080/vnc.html?autoconnect=true"\n\
echo "🔑 No password required!"\n\
echo "========================================"\n\
tail -f /dev/null' > /start.sh && chmod +x /start.sh

# Expose noVNC port
EXPOSE 6080

USER student
WORKDIR /home/student

CMD ["/start.sh"]