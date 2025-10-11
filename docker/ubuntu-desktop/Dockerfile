FROM dorowu/ubuntu-desktop-lxde-vnc:focal

ENV DEBIAN_FRONTEND=noninteractive

# Fix Google Chrome repository GPG key issue
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - || true

# Install cybersecurity tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    nmap \
    netcat-openbsd \
    traceroute \
    dnsutils \
    iputils-ping \
    net-tools \
    curl \
    wget \
    python3 \
    python3-pip \
    nano \
    vim \
    firefox \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create student user
RUN useradd -m -s /bin/bash student && \
    echo "student:student123" | chpasswd

# Create workspace
RUN mkdir -p /home/student/workspace && \
    mkdir -p /home/student/Desktop && \
    chown -R student:student /home/student

# Create desktop shortcuts
RUN echo '[Desktop Entry]' > /home/student/Desktop/terminal.desktop && \
    echo 'Type=Application' >> /home/student/Desktop/terminal.desktop && \
    echo 'Name=Terminal' >> /home/student/Desktop/terminal.desktop && \
    echo 'Exec=lxterminal' >> /home/student/Desktop/terminal.desktop && \
    echo 'Icon=utilities-terminal' >> /home/student/Desktop/terminal.desktop && \
    chmod +x /home/student/Desktop/terminal.desktop && \
    echo '[Desktop Entry]' > /home/student/Desktop/firefox.desktop && \
    echo 'Type=Application' >> /home/student/Desktop/firefox.desktop && \
    echo 'Name=Firefox' >> /home/student/Desktop/firefox.desktop && \
    echo 'Exec=firefox' >> /home/student/Desktop/firefox.desktop && \
    echo 'Icon=firefox' >> /home/student/Desktop/firefox.desktop && \
    chmod +x /home/student/Desktop/firefox.desktop && \
    chown -R student:student /home/student/Desktop

# Expose noVNC port
EXPOSE 6080

# Default VNC password is "vncpassword" in base image
CMD ["/startup.sh"]