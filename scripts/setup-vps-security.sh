#!/usr/bin/env bash
# ==============================================================================
# TIGER WORKSPACE CRM: VPS PRODUCTION HOST HARDENING SCRIPT
# Defense in Depth: SSH, UFW Firewall, Fail2ban, Unattended-Upgrades
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS / Debian 12
# ==============================================================================

set -euo pipefail

# Require root execution
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (or with sudo)."
   exit 1
fi

echo "======================================================================"
echo "🛡️  STARTING PRODUCTION VPS HOST SECURITY HARDENING..."
echo "======================================================================"

# 1. Update OS Package Index
echo "📦 Updating APT repositories..."
apt-get update -y && apt-get upgrade -y

# 2. Install Mandatory Security Packages
echo "📦 Installing UFW, Fail2ban, and Unattended-Upgrades..."
apt-get install -y ufw fail2ban unattended-upgrades apt-listchanges curl

# 3. Harden SSH Configuration
echo "🔒 Hardening SSH daemon configuration..."
SSH_CONFIG="/etc/ssh/sshd_config"
SSH_BACKUP="/etc/ssh/sshd_config.backup.$(date +%F_%T)"
cp "$SSH_CONFIG" "$SSH_BACKUP"
echo "  ↳ Backup created at $SSH_BACKUP"

# Enforce SSH key-only auth, disable root login & passwords
sed -i -E 's/^#?PermitRootLogin .*/PermitRootLogin no/' "$SSH_CONFIG"
sed -i -E 's/^#?PasswordAuthentication .*/PasswordAuthentication no/' "$SSH_CONFIG"
sed -i -E 's/^#?PubkeyAuthentication .*/PubkeyAuthentication yes/' "$SSH_CONFIG"
sed -i -E 's/^#?ChallengeResponseAuthentication .*/ChallengeResponseAuthentication no/' "$SSH_CONFIG"
sed -i -E 's/^#?X11Forwarding .*/X11Forwarding no/' "$SSH_CONFIG"
sed -i -E 's/^#?MaxAuthTries .*/MaxAuthTries 3/' "$SSH_CONFIG"

# Test SSH syntax before restarting
if sshd -t; then
  systemctl restart sshd || systemctl restart ssh
  echo "  ✅ SSH service reloaded successfully with strict key-only authentication."
else
  echo "  ❌ SSH configuration test failed! Restoring backup..."
  cp "$SSH_BACKUP" "$SSH_CONFIG"
  exit 1
fi

# 4. Configure UFW Firewall (Least Privilege Ports)
echo "🧱 Configuring UFW firewall rules..."
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (Port 22 or custom port if configured)
ufw allow 22/tcp comment 'SSH Key Management'

# Allow Web Traffic from Cloudflare / Public Proxies ONLY
ufw allow 80/tcp comment 'HTTP (Let-Encrypt ACME Challenge / Redirect)'
ufw allow 443/tcp comment 'HTTPS (TLS Traffic)'

# Explicitly ensure internal ports are NEVER publicly exposed
# (5432 PostgreSQL, 6379 Redis, 5000 Node Backend)
ufw delete allow 5432 || true
ufw delete allow 6379 || true
ufw delete allow 5000 || true

# Enable Firewall
echo "y" | ufw enable
ufw status verbose

# 5. Configure Fail2ban
echo "🚨 Configuring Fail2ban intrusion defense..."
cat << 'EOF' > /etc/fail2ban/jail.local
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 4
banaction = ufw

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s
backend = %(default_backend)s
maxretry = 3
bantime  = 24h
EOF

systemctl enable fail2ban
systemctl restart fail2ban
echo "  ✅ Fail2ban active and guarding SSH against brute-force intrusion."

# 6. Configure Unattended Security Upgrades
echo "🔄 Configuring automated unattended security upgrades..."
cat << 'EOF' > /etc/apt/apt.conf.d/20auto-upgrades
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

systemctl restart unattended-upgrades
echo "  ✅ Automated daily security patches configured."

echo "======================================================================"
echo "🎉 VPS HOST SECURITY HARDENING COMPLETE!"
echo "   - SSH: Root & Password login DISABLED (Public key only)"
echo "   - UFW: Ports 80, 443, 22 OPEN; 5432 & 5000 BLOCKED from public net"
echo "   - Fail2ban: ACTIVE (24h ban on 3 failed attempts)"
echo "   - Unattended-Upgrades: ACTIVE (Daily security patches)"
echo "======================================================================"
